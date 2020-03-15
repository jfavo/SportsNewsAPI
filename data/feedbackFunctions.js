const pool = require('./db')();
const encryption = require('./encryption');

module.exports = {

    //Feedback routes
    getAllFeedbacks: async function(){

        //Open connection to db
        const connection = await pool.getConnection();

        //Query db for feedback
        const feedback = await connection.execute('SELECT * FROM feedback');

        //Close the connection
        await connection.release();

        feedback[0] = await encryption.encryptIds(feedback[0]);

        return feedback[0];
    },

    getFeedbackById: async function(id){

        //Decrypt id if it is passed through encrypted
        if(isNaN(id)){
            id = await encryption.decryptId(id);
        }

        //Open connection to db
        const connection = await pool.getConnection();

        //Query db for feedback
        const feedback = await connection.execute('SELECT * FROM feedback WHERE id = ?', [id]);

        //Close the connection
        await connection.release();

        feedback[0] = await encryption.encryptIds(feedback[0]);

        return feedback[0][0];

    },

    insertFeedback: async function(feedback){

        //Open connection to db
        const connection = await pool.getConnection();

        //Query db to insert feedback
        const result = await connection.query('INSERT INTO feedback SET ?', [feedback]);

        //Release connection from pool
        await connection.release();

        return result;
    },

    insertBlankFeedback: async function(){

        //Open connection to db
        const connection = await pool.getConnection();

        //Query db to insert feedback
        const result = await connection.query('INSERT INTO feedback SET likes = ?, dislikes = ?', [0, 0]);

        //Release connection from pool
        await connection.release();

        return result;
    },

    updateFeedback: async function(feedback){

        //Decrypt id for db
        if (isNaN(feedback.id)) {
            feedback.id = await encryption.decryptId(feedback.id);
        }

        //Open connection to db
        const connection = await pool.getConnection();

        //Query db to insert feedback
        const result = await connection.query('UPDATE feedback SET ? WHERE id = ?', [feedback, feedback.id]);

        //Release connection from pool
        connection.release();

        return result;
    },

    deleteFeedback: async function(feedback){

        //Decrypt id for db
        if (isNaN(feedback.id)) {
            feedback.id = await encryption.decryptId(feedback.id);
        }

        //Open connection to db
        const connection = await pool.getConnection();

        //Query db to insert feedback
        const result = await connection.query('DELETE FROM feedback WHERE id = ?', [feedback.id]);

        //Release connection from pool
        connection.release();

        return result;
    },

    //Vote routes
    getAllVotes: async function(){

        //Open connection to db
        const connection = await pool.getConnection();

        //Query db for feedback
        const votes = await connection.execute('SELECT * FROM votes');

        //Close the connection
        await connection.release();

        votes[0] = await encryption.encryptVoteIds(votes[0]);


        return votes[0];
    },

    getVotesByUserId: async function(id){

        //Decrypt id for db
        id = await encryption.decryptId(id);
        
        //Open connection to db
        const connection = await pool.getConnection();

        //Query db for feedback
        const votes = await connection.execute('SELECT * FROM votes WHERE userId = ?', [id]);

        //Close the connection
        await connection.release();

        votes[0] = await encryption.encryptVoteIds(votes[0]);

        return votes[0];
    },

    insertVote: async function(vote){

        //Open connection to db
        const connection = await pool.getConnection();

        //Begin transaction for multiple querys
        await connection.beginTransaction();

        if(isNaN(vote.userId)){
            vote.userId = await encryption.decryptId(vote.userId);
        }

        if(isNaN(vote.feedbackId)){
            vote.feedbackId = await encryption.decryptId(vote.feedbackId);
        }

        try{

            const feedback = await connection.execute("SELECT * FROM feedback WHERE id = ?", [vote.feedbackId]);

            if(feedback[0][0]){
                if(vote.vote === "up"){
                    feedback[0][0].likes++;
                }else{
                    feedback[0][0].dislikes++;
                }
            }

            await connection.query("UPDATE feedback SET ? WHERE id = ?", [feedback[0][0], feedback[0][0].id]);

            //Add vote to db
            const result = await connection.query('INSERT INTO votes SET ?', [vote]);

            //Commit changes to db if no error occurs
            await connection.commit();

            return result;

        } catch(err){

            //Rollback any changes made to db if an error is caught
            await connection.rollback();

            //Throw error so parent can deal with it
            throw err;

        } finally {
           //Release connection from pool
            await connection.release(); 
        }

    },

    updateVote: async function(vote){
              
        //Decrypt id for db
        if (isNaN(vote.id)) {
            vote.id = await encryption.decryptId(vote.id);
        }
        
        if(!vote.id) return null;

        //Open connection to db
        const connection = await pool.getConnection();

        //Begin transaction for multiple querys
        await connection.beginTransaction();

        try{
            //Get current vote by id to see if vote has changed
            const prevVote = await connection.execute("SELECT * FROM votes WHERE id = ?", [vote.id]);

            //Get the feedback attached to the vote
            const feedback = await this.getFeedbackById(vote.feedbackId);

            //Update the vote on the feedback
            if(prevVote[0][0].vote !== vote.vote){
                if(prevVote[0][0].vote === ""){
                    if(vote.vote === "up") feedback.likes++;
                    else feedback.dislikes++;
                }
                else if(prevVote[0][0].vote === "up"){
                    feedback.likes--;

                    if(vote.vote === "down") feedback.dislikes++;
                }else{
                    feedback.dislikes--;

                    if(vote.vote === "up") feedback.likes++;
                }

                feedback.id = await encryption.decryptId(feedback.id);

                await connection.query("UPDATE feedback SET ? WHERE id = ?", [feedback, feedback.id]);
            }

            //Decrypt ids from vote
            vote.userId = await encryption.decryptId(vote.userId);
            vote.feedbackId = await encryption.decryptId(vote.feedbackId);

            //Update the vote
            const result = await connection.query('UPDATE votes SET ? WHERE id = ?', [vote, vote.id]);

            //Commit changes if there are no errors
            await connection.commit();

            return result;

        } catch(err) {
            //Rollback any changes made to db
            await connection.rollback();

            console.log(err.toString());
        } finally {
            //Release the connection to the pool
            await connection.release();
        }

        
    },

    deleteVote: async function(vote){

        //Decrypt id if it is passed through encrypted
        if (isNaN(vote.id)) {
            vote.id = await encryption.decryptId(vote.id);
        }

        //Open connection to db
        const connection = await pool.getConnection();
        
        //Start multi-query transaction for the connection
        //This allows us to rollback any changes made during
        //this connection if there is an error during any of
        //the queries
        await connection.beginTransaction();

        try{

            //We need to update the feedback that the vote is attached to
            //as it should no longer apply after it is deleted
            await this.removeVotes(vote);

            //Delete vote from db
            const result = await connection.query("DELETE FROM votes WHERE id = ?", [vote.id]);

            return result;

        } catch(err){
            await connection.rollback();

            throw err
        } finally {

            //Release connection from pool
            connection.release();

        }

    },

    //Removes votes from feedbacks, also decrypts ids if they are encrypted and returns
    //the votes
    removeVotes: async function(votes){
        
        for(var i = 0; i < votes.length; i++){

            const feedback = await this.getFeedbackById(votes[i].feedbackId);

            if(feedback){
                if(votes[i].vote === "up"){
                    feedback.likes--;
                }else{
                    feedback.dislikes--;
                }
            }

            //Update feedback to after removing the vote
            await this.updateFeedback(feedback);

            if(isNaN(votes[i].id)){
                votes[i].id = await encryption.decryptId(votes[i].id);
            }
        }
        
        return votes;
    }
}
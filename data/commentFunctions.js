const pool = require('./db')();
const encryption = require('./encryption');
const userData = require('./userFunctions');
const feedbackData = require('./feedbackFunctions');

module.exports = {

    getComments: async function(getUser, getFeedback, getComments){

        //Open connection from pool
        const connection = await pool.getConnection();

        const comments = await connection.execute("SELECT * FROM comments");

        comments[0] = await this.getCommentUser(comments[0], getUser);
        comments[0] = await this.getCommentFeedback(comments[0], getFeedback);

        if(getComments){
            comments[0] = await this.getCommentsCountForComment(comments[0]);
        }

        comments[0] = await encryption.encryptIds(comments[0]);

        //Close connection
        await connection.release();

        return comments[0];

    },

    getCommentById: async function(id, getUser, getFeedback, getComments){

        //Open connection from pool
        const connection = await pool.getConnection();

        const comments = await connection.execute("SELECT * FROM comments WHERE id = ?", [id]);

        comments[0] = await this.getCommentUser(comments[0], getUser);
        comments[0] = await this.getCommentFeedback(comments[0], getFeedback);

        if(getComments){
            comments[0] = await this.getCommentsCountForComment(comments[0]);
        }

        comments[0] = await encryption.encryptIds(comments[0]);

        //Close connection
        await connection.release();

        return comments[0];

    },

    getCommentsByArticleId: async function(articleId, commentId, startIndex = 0){
        //Open connection to db
        const connection = await pool.getConnection();

        //Get comments by appropriate id
        var commentIds;

        if(articleId !== "null"){
            articleId = await encryption.decryptId(articleId);
            commentIds = await connection.execute("SELECT commentId FROM commentsFor WHERE article = ?", [articleId])
        }else{
            commentId = await encryption.decryptId(commentId);
            commentIds = await connection.execute("SELECT commentId FROM commentsFor WHERE comment = ?", [commentId])
        }

        //Map ids into separate array
        var ids = commentIds[0].map(c => c.commentId);

        //Initialize comment array
        var comments = []

        for (var j = startIndex; (j < ids.length) && j <= startIndex + 15; j++) {

            const comment = await this.getCommentById(ids[j], true, true, true);

            if (comment) {
                comments.push(comment[0]);
            }
        }

        //Release connection to pool
        await connection.release();

        return comments;
    },

    //Insert comment into db, add new feedback to it
    insertComment: async function(comment, commentFor){

        //Open connection from pool
        const connection = await pool.getConnection();

        //Begin transaction for multiple queries
        await connection.beginTransaction();

        try {

            //Get new feedback and attach it to the comment
            const feedback = await feedbackData.insertBlankFeedback();
            let id = feedback[0].insertId;
            comment.feedbackId = id;

            const result = await connection.query("INSERT INTO comments SET ?", [comment]);

            let commentId = result[0].insertId;
            commentFor.commentId = commentId;

            if(commentFor.article){
                var article = await encryption.decryptId(commentFor.article.id);
                commentFor.article = article;
            }else{
                var comment = await encryption.decryptId(commentFor.comment.id);
                commentFor.comment = comment;
            }

            await connection.query("INSERT INTO commentsFor SET ?", [commentFor]);
            
            //Commit changes to db if no error occurs
            await connection.commit();

            return result;

        } catch(err) {

            //Rollback changes if error occurs
            await connection.rollback();

            throw err;

        } finally {
            //Close connection
            await connection.release();
        }

    },
    
    updateComment: async function(comment){

        //Open connection from pool
        const connection = await pool.getConnection();

        comment.id = await encryption.decryptId(comment.id);

        const result = await connection.query("UPDATE comments SET ? WHERE id = ?", [comment, comment.id]);

        //Close connection
        await connection.release();

        return result;

    },

    deleteComment: async function(comment){

        //Open connection from pool
        const connection = await pool.getConnection();

        //Begin transaction for multiple queries
        await connection.beginTransaction();

        try{

            comment.id = await encryption.decryptId(comment.id);

            //If feedbackId is not provided, query db for comment to obtain feedbackId
            if(!comment.feedbackId){
                const tmp = await this.getCommentById(comment.id, false, true);

                comment.feedbackId = tmp[0].feedback.id;
            }

            comment.feedbackId = await encryption.decryptId(comment.feedbackId);

            const result = await connection.query("DELETE FROM comments WHERE id = ?", [comment.id]);

            const feedbackRes = await connection.query("DELETE FROM feedback WHERE id = ?", [comment.feedbackId]);

            await connection.query("DELETE FROM commentFor WHERE commentId = ?", [comment.id]);

            //Commit changes to db if no error occurs
            await connection.commit();

            return result;

        } catch(err) {

            //Rollback changes if error occurs
            await connection.rollback();

            throw err;

        } finally {
            //Close connection
            await connection.release();
        }
        

    },

    getCommentFor: async function(comments){

        //Open connection from pool
        const connection = await pool.getConnection();

        for(var i = 0; i < comments.length; i++){

            const commentFor = await connection.execute("SELECT * FROM commentsFor WHERE commentId = ?", [comments[i].id]);
            delete commentFor[0][0].commentId;

            //Check to see if comment was attached to an article or another comment
            if(commentFor[0][0].comment){
                //Delete empty space
                delete commentFor[0][0].article;
                //Encrypt id for comment
                commentFor[0][0].comment = await encryption.encryptId(commentFor[0][0].comment);

                comments[i].for = commentFor[0][0];
            }else{
                //Delete empty space
                delete commentFor[0][0].comment;
                //Encrypt id for article
                commentFor[0][0].article = await encryption.encryptId(commentFor[0][0].article);

                comments[i].for = commentFor[0][0];
            }

        }

        //Close connection to pool
        await connection.release();

        return comments;

    },

    getCommentUser: async function(comments, getUser){

        for(var i = 0; i < comments.length; i++){

            if(getUser){
                comments[i].user = await userData.getUserById(comments[i].userId, true);
            }

            delete comments[i].userId;
        }

        return comments;

    },

    getCommentFeedback: async function(comments, getFeedback){

        for(var i = 0; i < comments.length; i++){

            if(getFeedback){
                comments[i].feedback = await feedbackData.getFeedbackById(comments[i].feedbackId);
            }

            delete comments[i].feedbackId;
        }

        return comments;

    },

    getCommentsCountForComment: async function(comments){

        //Open connection to pool
        const connection = await pool.getConnection();

        for(var i = 0; i < comments.length; i++){

            const commentCount = await connection.query("SELECT COUNT(commentId) FROM commentsFor WHERE comment = ?", [comments[i].id]);

            comments[i].commentCount = commentCount[0][0]['COUNT(commentId)'];
        }

        //Release connection from pool
        await connection.release();

        return comments;

    },

}
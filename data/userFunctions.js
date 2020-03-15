const pool = require('./db')();
const feedbackData = require('../data/feedbackFunctions');
const encryption = require('./encryption');

module.exports = {

    //Retrieves all users from db
    getAllUsers: async function (getRole){

        //Open connection to db
        const connection = await pool.getConnection();

        //Query db for users
        const users = await connection.execute('SELECT id, roleId, username, email, firstName, lastName, dateCreated FROM users');

        //Release connection from pool
        await connection.release();

        if(getRole){
            users[0] = await this.getUserRoles(users[0]);
        }

        //Encrypt userId
        users[0] = await encryption.encryptIds(users[0]);
        
        
        return users[0];
    },

    //Retrieves user by id from db
    getUserById: async function (id, getRole){

        if(isNaN(id)){
            id = await encryption.decryptId(id);
        }

        //Open connection to db
        const connection = await pool.getConnection();

        //Query db for user
        const users = await connection.execute('SELECT id, roleId, username, email, firstName, lastName,  dateCreated FROM users WHERE id = ?', [id]);

        //Release connection from pool
        await connection.release();

        if(getRole){
            users[0] = await this.getUserRoles(users[0]);
        }

        //Encrypt userId
        users[0] = await encryption.encryptIds(users[0]);

        return users[0][0];
    },

    //Adds user to db
    insertUser: async function(user){

        //Open connection to db
        const connection = await pool.getConnection();

        //Query db for user
        const result = await connection.query('INSERT INTO users SET email = ?, password = aes_encrypt(?, "testpassword"), firstName = ?, lastName = ?, roleId = ?', [user.email, user.password, user.firstName, user.lastName, user.roleId]);

        //Release connection from pool
        await connection.release();

        return result;

    },

    //Updates user
    updateUser: async function(user){

        //Decrypt id if it is encrypted
        if (isNaN(user.id)) {
            user.id = await encryption.decryptId(user.id);
        }

        //Open connection to db
        const connection = await pool.getConnection();

        //Query db for user
        const result = await connection.query('UPDATE users SET ? WHERE id = ?', [user, user.id]);

        //Release connection from pool
        await connection.release();

        return result;

    },

    //Deletes votes that the user has made as well as the user
    deleteUser: async function(user){

        //Decrypt id if it is encrypted
        if (isNaN(user.id)) {
            user.id = await encryption.decryptId(user.id);
        }

        //Open connection to db
        const connection = await pool.getConnection();

        //Begin transaction for multiple queries
        await connection.beginTransaction();

        try{
            
            //Check for users votes
            var votes = await feedbackData.getVotesByUserId(user.id);

            //Remove the votes from the feedbacks associated with them
            votes = await feedbackData.removeVotes(votes);

            //Get the ids from the votes
            let voteIds = votes.map(v => v.id);

            //Delete the votes from the db
            await connection.query("DELETE FROM votes WHERE id = ?",  [voteIds])

            //Query db to delete user
            const result = await connection.query("DELETE FROM users WHERE id = ?", [user.id]);

            //Commit changes to db if there are no errors
            await connection.commit();

            return result;

        } catch(err) {

        } finally{
            //Release connection from pool
            await connection.release();
        }
    },

    getUserRoles: async function (users){
   
        //Loop through and add user query db for specific role for user
        for(var i = 0; i < users.length; i++){

            //Query db for user's role
            users[i]['role'] = await this.getRoleById(users[i].roleId);

            //remove role Id from object
            delete users[i]['roleId'];

        }
        return users;
    },

    checkEmailExists: async function(user){

        //Open connection to db
        const connection = await pool.getConnection();

        const usernameExists = await connection.execute('SELECT * FROM users WHERE email=?', [user.email]);

        await connection.release();

        if(usernameExists[0][0]) return true;
        else return false;
    },

    checkLogin: async function(user){

        //Open connection to db
        const connection = await pool.getConnection();

        //Check to see if email and password match in the db
        const login = await connection.execute('SELECT * FROM users WHERE email=? AND password=aes_encrypt(?, "testpassword")', [user.email, user.password]);

        //Release connection to db
        await connection.release();

        if(login[0].length > 0) {
            return await this.getUserById(login[0][0].id, true);
        }
        else {
            return false;
        }
    },

    getRoleById: async function (id){

        if(isNaN(id)){
            id = await encryption.decryptId(id);
        }

        //Open connection to db
        const connection = await pool.getConnection();

        //Query db for user role
        const role = await connection.execute('SELECT type FROM roles WHERE id = ?', [id]);
        await connection.release();

        return role[0][0].type;
    }

}

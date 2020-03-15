const pool = require('./db')();
const userData = require('./userFunctions');
const feedbackData = require('./feedbackFunctions');
const commentData = require('./commentFunctions');
const encryption = require('./encryption');

module.exports = {

    getAllArticles: async function(getImages, getUser, getFeedback, getComments, startIndex = 0, getCount = 15){

        //Open connection to db
        const connection = await pool.getConnection();

        //Query db for articles
        const articles = await connection.execute('SELECT * FROM articles LIMIT ?, ?', [startIndex, getCount]);

        //Release the connection from the pool
        await connection.release();
        
        //Add article type
        articles[0] = await this.getArticleTypes(articles[0]);

        if(getImages){
            articles[0] = await this.getArticleImages(articles[0]);
        }

        if(getComments){
            articles[0] = await this.getArticleCommentCount(articles[0]);
        }

        articles[0] = await this.getArticleUser(articles[0], getUser);
        articles[0] = await this.getArticleFeedback(articles[0], getFeedback);
        

        //Encrypt article id before sending data back to router
        articles[0] = await encryption.encryptIds(articles[0]);

        return articles[0];

    },

    getArticleById: async function (id, getImages, getUser, getFeedback, getComments) {

        //Decrypt id if it is passed through encrypted
        if(isNaN(id)){
            id = await encryption.decryptId(id);
        }

        //Open connection to db
        const connection = await pool.getConnection();

        //Query db for articles
        const article = await connection.execute('SELECT * FROM articles WHERE id = ?', [id]);

        //Release the connection from the pool
        await connection.release();

        if(article.length < 1) return article;

        //Get article type
        article[0] = await this.getArticleTypes(article[0]);

        if(getImages){
            article[0] = await this.getArticleImages(article[0]);
        }

        if(getComments){
            article[0] = await this.getArticleCommentCount(article[0]);
        }

        article[0] = await this.getArticleUser(article[0], getUser);
        article[0] = await this.getArticleFeedback(article[0], getFeedback);

        //Encrypt article id before sending data back to router
        article[0] = await encryption.encryptIds(article[0]);

        return article[0];
    },

    insertArticle: async function(article, images){

        //Open connection to db
        const connection = await pool.getConnection();

        //Begin transaction for multiple queries
        await connection.beginTransaction();

        try{

            //Create feedback to give the article
            const feedback = await connection.query('INSERT INTO feedback SET likes = ?, dislikes = ?', [0, 0]);

            article['feedbackId'] = feedback[0].insertId;

            const result = await connection.query('INSERT INTO articles SET ?', [article]);

            if(result && images.length > 0){
                for(var i = 0; i < images.length; i++){
                    await connection.query("INSERT INTO articleImage SET articleId = ?, imageUrl = ?", [result[0].insertId, images[i]]);
                }
            }

            //Commit changes to db;
            await connection.commit();

            return result;

        } catch(err) {
            console.log('hit');
            //If error occurs, rollback any changes made to db
            await connection.rollback();

            //Throw error to be caught by parent
            throw err;
        } finally {

            //Release connection from pool
            connection.release();
        }


    },

    updateArticle: async function(article){

        //Decrypt id if needed
        if(isNaN(article.id)){
            article.id = await encryption.decryptId(article.id);
        }

        //Open connection to db
        const connection = await pool.getConnection();

        //Set new edited date
        article.dateEdited = new Date();

        const result = await connection.query('UPDATE articles SET ? WHERE id = ?', [article, article.id]);

        //Release connection from pool
        connection.release();

        return result;
    },

    deleteArticle: async function(article){

        //Decrypt id if encrypted
        article.id = await encryption.decryptId(article.id);
        
        //Open connection to db
        const connection = await pool.getConnection();

        //Begin transaction for multiple querys
        await connection.beginTransaction()

        try{

            //Delete articleImages before deleting the article
            await connection.query("DELETE FROM articleImage WHERE articleId = ?", [article.id]);
            const results = await connection.query("DELETE FROM articles WHERE id = ?", [article.id]);

            //Commit changes to db if no error occurs
            await connection.commit();

            return results;

        } catch(err) {

            //Roll back any changes made to db if error occurs
            await connection.rollback();

            //Throw error to be caught by parent
            throw error

        } finally {
            await connection.release()
        }

    },

    getArticleImages: async function(articles){

        for(var i = 0; i < articles.length; i++){
            //Open connection to db
            const connection = await pool.getConnection();

            //Query db for article's images and pass the urls to the article
            const images = await connection.execute('SELECT imageUrl FROM articleImage WHERE articleId = ?', [articles[i].id]);
            articles[i]['images'] = []

            images[0].forEach(element => {
                articles[i]['images'].push(element['imageUrl'])
            });
    
            //Release the connection from the db pool
            await connection.release();
        }
    
        return articles;
    },

    getArticleCommentCount: async function(articles, startIndex = 0){

        //Open connection to db
        const connection = await pool.getConnection();

        for(var i = 0; i < articles.length; i++){

            const commentCount = await connection.execute("SELECT COUNT(*) FROM commentsFor WHERE article = ?", [articles[i].id])

            let count = commentCount[0][0]['COUNT(*)'];
            count = count ? count : 0;

            articles[i].commentCount = count;

        }

        //Release connection to pool
        await connection.release();

        return articles;

    },

    getArticleTypes: async function (articles){

        for(var i = 0; i < articles.length; i++){
            //Open connection to db
            const connection = await pool.getConnection();

            //Query db for article type and add it to the article
            const type = await connection.execute('SELECT type FROM articleType WHERE id = ?', [articles[i].articleTypeId]);
            articles[i]['type'] = type[0][0].type

            //Remove id 
            delete articles[i]['articleTypeId'];

            //Release the connection from the db pool
            await connection.release();
        }
    
        return articles;

    },
    
    getArticleUser: async function (articles, getUser){

        for(var i = 0; i < articles.length; i++){
            
            if(getUser){
                
                //Query db for user for the article and add to the article
                const user = await userData.getUserById(articles[i].userId, true);

                articles[i]['user'] = user;
            }

            //Remove the userId from the article
            delete articles[i]['userId'];
    
        }

        return articles;
    },

    getArticleFeedback: async function (articles, getFeedback){

        for(var i = 0; i < articles.length; i++){

            if(getFeedback){
                //Query db for feedback
                const feedback = await feedbackData.getFeedbackById(articles[i].feedbackId);
                articles[i]['feedback'] = feedback;
            }

            //Remove the feedbackId from the article
            delete articles[i]['feedbackId'];
        }

        return articles;
    }

}
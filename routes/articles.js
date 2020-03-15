var express = require('express');
var articleData = require('../data/articleFunctions');
var pool = require('../data/db')();
var router = express.Router();

//Get all articles
router.get('/articles', async function(req, res){
    
    let getImages = req.query.getImages;
    let getUser = req.query.getUser;
    let getFeedback = req.query.getFeedback;
    let getComments = req.query.getComments;
    let startIndex = req.query.startIndex;
    let getCount = req.query.getCount;

    try {

        const articles = await articleData.getAllArticles(getImages, getUser, getFeedback, getComments, startIndex, getCount);

        return res.json({error: false, data: articles});

    } catch(err){
        //TODO: Log error
        return res.status(400).json({error: true, message: err.toString()})
    } 
})
//Get article by id
router.get('/articles/:id', async function(req, res){

    let id = req.params.id;

    let getImages = req.query.getImages;
    let getUser = req.query.getUser;
    let getFeedback = req.query.getFeedback;
    let getComments = req.query.getComments;

    try{

        const article = await articleData.getArticleById(id, getImages, getUser, getFeedback, getComments);

        if(article.length < 1){
            return res.json({error: true, message:"Failed to get article"})
        }

        return res.json({error: false, data: article[0]});

    } catch(err) {

        //TODO: Log error
        return res.status(400).json({error: true, message: err.toString()});

    }

})
//Insert article and article images into db
router.post('/articles', async function(req, res){

    let article = req.body.article;
    let images = req.body.images;

    if(!article){
        return res.json({error: true, message:"Failed to get article data"})
    }

    try{

        const result = await articleData.insertArticle(article, images);

        return res.json({error: false, data: result});

    } catch(err) {

        //TODO: Log error
        return res.status(400).json({error: true, message: err.toString()});
    }

})
//Update article
router.put('/articles', async function(req, res){

    let article = req.body.article;

    if(!article){
        return res.json({error: true, message:"Failed to get article data"})
    }

    try{
        const result = await articleData.updateArticle(article);

        return res.json({error: false, data: result});

    } catch(err) {

        //TODO: Log error
        return res.status(400).json({error: true, message: err.toString()});
    }

})
//Delete article and article images
router.delete('/articles', async function(req, res){

    let article = req.body.article;

    if(!article){
        return res.json({error: true, message:"Failed to get article data"})
    }

    try{
        const result = await articleData.deleteArticle(article);

        return res.json({error: false, data: result});

    } catch(err) {

        //TODO: Log error
        return res.status(400).json({error: true, message: err.toString()});
    }

})

module.exports = router;
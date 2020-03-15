const express = require('express');
const commentData = require('../data/commentFunctions');
const router = express.Router();


router.get('/comments', async function(req, res){

    let getUser = req.query.getUser;
    let getFeedback = req.query.getFeedback;
    let getComments = req.query.getComments;
    let article = req.query.article;
    let comment = req.query.comment;
    let startIndex = req.query.startIndex;

    try{
        var results;

        if(article || comment){
            results = await commentData.getCommentsByArticleId(article, comment, startIndex);
        }
        else{
            results = await commentData.getComments(getUser, getFeedback, getComments);
        }

        return res.json({error: false, data: results});

    } catch(err) {

        //TODO log error

        res.status(400).json({error: true, message: err.toString() });

    }

})

router.get('/comments/:id', async function(req, res){

    let id = req.params.id;
    let getUser = req.query.getUser;
    let getFeedback = req.query.getFeedback;
    let getComments = req.query.getComments;
    
    try{

        const results = await commentData.getCommentById(id, getUser, getFeedback, getComments);

        return res.json({error: false, data: results});

    } catch(err) {

        //TODO log error

        res.status(400).json({error: true, message: err.toString() });

    }

})

router.post('/comments', async function(req, res){

    let comment = req.body.comment;
    let commentFor = req.body.commentFor;

    try{

        const result = await commentData.insertComment(comment, commentFor);

        return res.json({error: false, data: result});

    } catch(err) {

        //TODO Log error

        return res.status(400).json({error: true, message: err.toString() });

    }

})

router.put('/comments', async function(req, res){

    let comment = req.body.comment;

    try{

        const result = await commentData.updateComment(comment);

        return res.json({error: false, data: result});

    } catch(err) {

        //TODO Log error

        return res.status(400).json({error: true, message: err.toString() });

    }
})

router.delete('/comments', async function(req, res){

    let comment = req.body.comment;

    try{

        const result = await commentData.deleteComment(comment);

        return res.json({error: false, data: result});

    } catch(err) {

        //TODO Log error

        return res.status(400).json({error: true, message: err.toString() });

    }

})


module.exports = router;
const express = require('express');
const feedbackData = require('../data/feedbackFunctions');
const router = express.Router();

//Get all feedbacks
router.get('/feedbacks', async function(req, res){

    try{
        const feedbacks = await feedbackData.getAllFeedbacks();

        res.json({error: false, data: feedbacks});

    } catch(err) {
        //TODO Log error
        return res.status(400).json({error: true, message: err.toString()})
    }

})
//Get feedback by id
router.get('/feedbacks/:id', async function(req, res){

    let id = req.params.id;

    if(!id){
        return res.status(400).json({error: true, message: "We had an issue getting the data."})
    }

    try{
        const feedback = await feedbackData.getFeedbackById(id);

        if(!feedback){
            return res.json({error:true, message: "This feedback doesn't exist!"})
        }

        return res.json({error: false, data: feedback});
    }catch(err){
        //TODO Log error
        return res.status(400).json({error: true, message: err.toString() });
    }

})
//Insert feedback 
router.post('/feedbacks', async function(req, res){

    let feedback = req.body.feedback;

    //If feedback is null from the body, return error
    if(!feedback){
        return res.status(400).json({error: true, message: "We had an issue getting the data."})
    }

    try{
        const result = await feedbackData.insertFeedback(feedback);

        if(!result){
            return res.status(400).json({error:true, message: "There was an issue adding the feedback"})
        }else{
            return res.json({error: false, data: result});
        }

    }catch(err){
        //TODO Log error
        return res.status(400).json({error: true, message: err.toString()});
    }

})
//Update feedback
router.put('/feedbacks', async function(req, res){

    let feedback = req.body.feedback;

    //If feedback is null from the body, return error
    if(!feedback){
        return res.status(400).json({error: true, message: "We had an issue getting the data."})
    }

    try{
        const result = await feedbackData.updateFeedback(feedback);

        if(!result){
            return res.status(400).json({error:true, message: "There was an issue adding the feedback"})
        }else{
            return res.json({error: false, data: result});
        }

    }catch(err){
        //TODO Log error
        return res.status(400).json({error: true, message: err.toString()});
    }

})
//Delete feedback
router.delete('/feedbacks', async function(req, res){

    let feedback = req.body.feedback;

    //If feedback is null from the body, return error
    if(!feedback){
        return res.status(400).json({error: true, message: "We had an issue getting the data."})
    }

    try{
        const result = await feedbackData.deleteFeedback(feedback);

        if(!result){
            return res.status(400).json({error:true, message: "There was an issue adding the feedback"})
        }else{
            return res.json({error: false, data: result});
        }

    }catch(err){
        //TODO Log error
        return res.status(400).json({error: true, message: err.toString()});
    }

})

//Get all votes
router.get('/votes', async function(req, res){

    try{
        const votes = await feedbackData.getAllVotes();

        res.json({error: false, data: votes})
    }catch(err){
        //TODO: Log error
        return res.status(400).json({error: true, message: err.toString() });
    }
})
//Get vote by user id
router.get('/votes/:userId', async function(req, res){

    let id = req.params.userId;

    if(!id){
        return res.status(400).json({error: true, message: "We had an issue getting the data."})
    }

    try{
        const votes = await feedbackData.getVotesByUserId(id);

        res.json({error:false, data: votes})
    }catch(err){
        //TODO: Log error
        return res.status(400).json({error: true, message: err.toString() })
    }

})
//Insert vote and update feedback
router.post('/votes', async function(req, res){

    let vote = req.body.vote;

    if(!vote){
        return res.status(400).json({error: true, message: "We had an issue getting the data."})
    }

    try{
        const result = await feedbackData.insertVote(vote);

        res.json({error: false, data: result[0]});
    }catch(err){
        //TODO: Log error
        return res.status(400).json({error: true, message: err.toString()})
    }

})
//Update vote and update feedback
router.put('/votes', async function(req, res){

    let vote = req.body.vote;

    if(!vote){
        return res.status(400).json({error: true, message: "We had an issue getting the data."})
    }

    try{
        const result = await feedbackData.updateVote(vote);

        if(!result){
            res.status(200).json({error:true, message: "There was an issue updating vote"})
        }else{
            res.json({error: false, data: result[0]});
        }
    }catch(err){
        //TODO: Log error
        return res.status(400).json({error: true, message: err.toString()});
    }
})
//Delete vote and update feedback
router.delete('/votes', async function(req, res){

    let vote = req.body.vote;

    if(!vote){
        return res.status(400).json({error: true, message: "We had an issue getting the data."})
    }

    try{
        const result = await feedbackData.deleteVote(vote);

        if(!result){
            res.status(200).json({error:true, message: "There was an issue deleting the vote"})
        }else{
            res.json({error: false, data: result[0]});
        }
    }catch(err){
        //TODO: Log error
        return res.status(400).json({error: true, message: err.toString()});
    }

})

module.exports = router;
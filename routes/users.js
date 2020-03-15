const express = require('express');
const userData = require('../data/userFunctions');
const pool = require('../data/db')();
const router = express.Router();

//Get all users
router.get('/users', async function(req, res){

    try{
        const users = await userData.getAllUsers(true);

        return res.json({error: false, data: users});

    }catch(err){

        return res.status(400).json({ error: true, message: err.toString() })
    }finally{

    }

})
//Get user by id
router.get('/users/:id', async function(req, res){

    let id = req.params.id;

    try{
        const users = await userData.getUserById(id, true);
        return res.json({error: false, data:users})
    }catch(err){

        return status(400).json({error: true, message: err.toString()});
    }

})
//Insert new user
router.post('/users', async function(req, res){

    let user = req.body.user;

    if(!user){
        return res.status(400).json({error: true, message: "There was an issue getting the data"});
    }

    try{

        const result = await userData.insertUser(user);

        if(!result){
            return res.json({error: true, message: "There was an issue!"})
        }else{
            return res.json({error: false, data: result});
        }

    }catch (err){
        //TODO Log error
        return res.status(400).json({error: true, message: err.toString()});
    }
})
//Update user
router.put('/users', async function(req, res){

    let user = req.body.user;

    if(!user){
        return res.status(400).json({error: true, message: "There was an issue getting the data"});
    }

    //Check to see if password was passed to the router
    //If so remove it. We will only update the password in
    //a specific router
    if(user.password){
        delete user.password;
    }


    try{

        const result = await userData.updateUser(user);

        if(!result){
            return res.json({error: true, message: "There was an issue!"})
        }else{
            return res.json({error: false, data: result});
        }

    }catch (err){
        //TODO Log error
        return res.status(400).json({error: true, message: err.toString()});
    }
})
//Delete user
router.delete('/users', async function(req, res){

    let user = req.body.user;

    if(!user){
        return res.status(400).json({error: true, message: "There was an issue getting the data"});
    }

    try{

        //Check to see if user exists before deletion
        const check = await userData.getUserById(user.id);

        if(!check){
            return res.json({error: true, message: "User does not exist!"});
        }

        const result = await userData.deleteUser(user);

        if(!result){
            return res.json({error: true, message: "There was an issue!"})
        }else{
            return res.json({error: false, data: result});
        }

    }catch (err){
        //TODO Log error
        return res.status(400).json({error: true, message: err.toString()});
    }
})
//Check if login was successful
router.post('/users/login', async function(req, res){

    let user = req.body.user;

    try{

        const emailExists = await userData.checkEmailExists(user);

        if(!emailExists){
            return res.json({error: true, message: "Email does not exist"});
        }

        const loginSuccess = await userData.checkLogin(user);
        
        if(loginSuccess){
            return res.json({error: false, data: loginSuccess });
        }else{
            return res.json({error: true, message: "Password is incorrect"});
        }

    }catch(err){

        res.status(400).json({error: true, message: err.toString()});
    }
})

module.exports = router;

const crypto = require('crypto');
const algorithm = 'aes-128-cbc';
const key = 'testpassword';


module.exports = {

    encrypt: function (text){
        let cipher = crypto.createCipher(algorithm, key);
        let encrypt = cipher.update(text, 'utf8', 'hex');
        encrypt += cipher.final('hex');

        return encrypt;
    },

    decrypt: function (text){
        var cipher = crypto.createDecipher(algorithm, key); 
        var decrypt = cipher.update(text, 'hex', 'utf8');     
        decrypt += cipher.final('utf8');

        return decrypt;
    },

    encryptIds: async function(collection){

        for(var i = 0; i < collection.length; i++){

            collection[i].id = this.encrypt(collection[i].id.toString());

        }

        return collection;
    },

    decryptIds: async function(collection){

        for(var i = 0; i < collection.length; i++){

            collection[i].id = parseInt(this.decrypt(collection[i].id))
            
        }

    },

    encryptId: async function(id){
        return this.encrypt(id.toString());
    },

    decryptId: async function(id){

        if(!isNaN(id)) return id;

        try{
            return this.decrypt(id);
        }catch(err){
            return null;
        }

    },

    encryptVoteIds: async function(votes){

        for(var i = 0; i < votes.length; i++){

            votes[i].id = await this.encryptId(votes[i].id);
            votes[i].feedbackId = await this.encryptId(votes[i].feedbackId);
            votes[i].userId = await this.encryptId(votes[i].userId);

        }

        return votes;

    },

    decryptVoteIds: async function(votes){

        for(var i = 0; i < votes.length; i++){

            votes[i].id = await this.decryptId(votes[i].id);
            votes[i].feedbackId = await this.decryptId(votes[i].feedbackId);
            votes[i].userId = await this.decryptId(votes[i].userId);

        }

        return votes;
    }

}
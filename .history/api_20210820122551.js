const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs');
const axios = require('axios');
const shelljs = require('shelljs');
const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const config = require('./config.json');
const { Paynow } = require("paynow");
const randomString = require('random-string');
const cors = require('cors');
const system = require('system-commands');
const elastic = require('./elastic.js');



const SESSION_FILE_PATH = './session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    // sessionCfg = require(SESSION_FILE_PATH);
    // sessionCfg = "";
}
process.title = "whatsapp-node-api";
global.client = new Client({ qrTimeoutMs: 0,puppeteer: {  headless: true ,args:['--no-sandbox','--disable-setuid-sandbox','--unhandled-rejections=strict'] },session: sessionCfg});
///
global.authed = false;
const app = express();



var serviceAccount = require("./service-account.json");
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");



   

/**
 *  Initiating paynow
 */
 const paynow = new Paynow("4114", "857211e6-052f-4a8a-bb42-5e0d0d9e38e7");

const port = process.env.PORT || config.port;
//Set Request Size Limit 50 MB

client.initialize();

client.on('qr', qr => {
    // console.log("initialize QR")
    qrcode.generate(qr, {small: true});
    fs.writeFileSync('./components/last.qr',qr);
});



client.on('authenticated', (session) => {
    console.log("AUTH HAS WORKED!");
    sessionCfg = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function(err) {
        if (err) {
            console.error(err);
        }
        authed=true;
    });
    try{
        fs.unlinkSync('./components/last.qr')
    }catch(err){}
});

client.on('auth_failure', () => {
    console.log("AUTH Failed !")
    sessionCfg = ""
    process.exit()
});

client.on('ready', () => {
    console.log('Client is running!');
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});


var myProperties = new Map();
var agentExp = new Map();
var subExp = new Map();
var payments = new Map();
var messageChain = new Map();
var clientMap = new Map();
var mainAd = "Make your house into a home through customized furniture, 60% deposit, balance on delivery  \nCheck our catalog https://wa.me/c/263713020524";
var subCounter = 0;
var adsForClient = new Map();
var messageCounterMap =  new Map();

client.on('message', async msg => {
    
  
    
  
    if(msg.from.length < 23){

        /// A unique identifier for the given session
         const sessionId = randomString({length: 20});
         const query = msg.body;
         const no = msg.from;
         
         
         const user = await msg.getContact();
         
         var name = user.pushname;
         if(name === undefined){
             name = "";
         }
            
        
            // array message
            var messageToSend = "";
            // this current users houses checked
            var budget = 0;
            var beds = 0;
            // Answers ==> 1) 25 2) 50  3) 100 4) 150 5) 200 6) 300 7) 400 8) 600 9) 800 10) 1500                   
                    
            var messages = [];

           
               // check if user has sent a message to the app before
            if(messageChain.has(no)){
                messages = messageChain.get(no); 
                // array message
                // var houseArray = [];
                // this current users houses checked
                // var houses = [];
                var budget = 0;
                var beds = 0;

                if(query == "#"){
                    messageToSend += "You have reset now.\nType hi message to continue";
                    messageChain.delete(no);
                                        
                    client.sendMessage(msg.from,messageToSend).then((res) => {
                        // console.log("Res " + JSON.stringify(res));
                    }).catch((err) =>{
                        console.log("Error on # query " + err)
                    });
                } else if(query.toLowerCase() == "unsubscribe" || query.toLowerCase() == "unsubs" || query.toLowerCase() == "unsub"){
                    elastic.unsubscribe(no).then((res) => {
                        messageToSend += "It was an honor to serve you, all the best in the next part of your journey";
                        messageChain.delete(no);
                                        
                        client.sendMessage(msg.from,messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                        }).catch((err) =>{
                            console.log("Error on # query " + err)
                        });
                    
                    }).catch(console.log)
				} else {
                    
                        switch(messages.length){
                            case 1:
                                if(messages.length > 2){
                                    messageToSend += "Our apology there was a network error, kindly try again";
                                    messageChain.delete(no);
                                
                                } else {
                                    if(clientMap.has(no)) {
                                        
                                        if(query == 0){
                                            messages.push(query);
                                            messageChain.set(no, messages);
                                            messageToSend += `${mainAd} \n\n1)Type 1 to be connected to our Sales Rep  \#) type # to Restart`;
                                            client.sendMessage(msg.from,messageToSend).then((res) => {
                                        
                                            }).catch((err) =>{
                                                console.log("Error on sending properties => " + err)
                                            });

                                            
                                            
                                            
                                            
                                        } else if(query == 1){
                                            messages.push(query);
                                            messageChain.set(no, messages);

                                            var noOfMessages = 0;
                                            noOfMessages++;
                                            messageCounterMap.set(no,noOfMessages);
                                            
                                                
                                            
                                            var ad = getAd(no,noOfMessages);
                                            // console.log(ad);
                                            var advert = "";
                                            if(Object.entries(ad).length === 0){
                                                advert = mainAd;
                                            } else {
                                                advert = ad._source.adText; // ERROR PRONE
                                            }
                                            

                                            
                                            elastic.getRentalPropertyClientMatches(clientMap.get(no),0).then((res) => {
                                            
                                                var results = res.hits.hits;
                                            
                                                if(results.length > 0){
                                                    var properties = [];
                                                    messageToSend += "These are the properties that best match your profile\n\n";
                                                    for(var i = 0;i < results.length;i++){
                                                        var info = results[i]._source;
                                                        
                                                        messageToSend += `\n\n${info.beds} beds in ${info.suburb}  ${info.city} to let for *${info.rent}* \n${info.description} \nContact ${info.contact} \n\n`;
                                                        if(i == 0){
                                                            messageToSend += `🔥🔥*HOT DEAL*🔥🔥\n ${advert}\n\n`;
                                                        }
                                                        if(i == 3){
                                                            messageToSend += `🔥🔥*HOT DEAL*🔥🔥\n ${advert}\n\n`;
                                                        }
                                                        properties.push(info);
                                                    
                                                    };
                                                    myProperties.set(no, properties);
                                                    messageToSend += "____________End_______________";
                                                    messageToSend += `\n*PlEASE type one the numbers below to select the next the option you want* e.g 2  \n1)Type 1 to see the next 7 properties \n2)Type 2 to update your search profile \n3)Type 3 to *SUBSCRIBE FOR FREE* \n4) Type 4 to *help others tenants* \n5) *Experiences*(Share & Learn) \n#) Restart(type *#* to restart) \n\n\n🔥🔥 *HOT DEAL* 🔥🔥: ${advert}`;
                                
                                                    client.sendMessage(msg.from,messageToSend).then((res) => {
                                                        // console.log("Res " + JSON.stringify(res));
                                                        elastic.addHits(no).then((res) => {
                                                        
                                                        }).catch((err) =>{
                                                            console.log("Error on hits item => " + err)
                                                        });
                                                    }).catch((err) =>{
                                                        console.log("Error on sending properties => " + err)
                                                    });
                                                
                                                } else {
                                                    messageToSend += `We do not have properties that match your profile at the moment, but you can check again later, see you soon, \nType # to restart \n\n\n😃 *SPONSORED* : ${mainAd}`;
                                                    client.sendMessage(msg.from,messageToSend).then((res) => {
                                                        // console.log("Res " + JSON.stringify(res));
                                                    }).catch((err) =>{
                                                        console.log("Error on posting a house => " + err)
                                                    });
                                                }
    
                                            }).catch((err) =>{
                                                console.log("Error on second item => " + err)
                                            });

                                            

                                            
                                        } else if(query == 2){
                                            messages.push(query);
                                            messageChain.set(no, messages);
                                            messageToSend += `Thank you for choosing to work with us, please type the full details of the property here, rental price,suburb and city, description of the property(floor type, storage space(BIC), ceiling etc), security, water, size of the property, proximity to essential services like transport and supermarkets`;
                                            client.sendMessage(msg.from,messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                            }).catch((err) =>{
                                                console.log("Error on posting a house => " + err)
                                            });
                                        } else if(query == 3) {
                                            messages.push(query);
                                            messageChain.set(no, messages);
                                            messageToSend += "Our apologies for your inconviniences please type a detailed report of your experience and our team will attend to it promptly";
                                            client.sendMessage(msg.from,messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                            }).catch((err) =>{
                                                console.log("Error on report reporting => " + err)
                                            });
                                        } else if(query == 4) {
                                            messages.push(query);
                                            messageChain.set(no, messages);
                                            messageToSend += "Terms and conditions as at 18.07.2021 \n 1.	Consultancy Hub is an advertising medium and does not own or manage the properties listed here, the properties shown are from either tenants moving from the property, landlords or agents who have no association with Consultancy Hub.\n2.	For extra details and pictures contact the person indicated on the property \n3.  You agree the other property you mentioned you were moving from,  is truly where you are coming from, and others might contact you, for your to help connect them to the landlord, without charging them any money.\n4.	You agree that you will not use the contacts from the NETWORK as a business for yourself or other people connected to you,\n5.	We are not a real estate company but a marketing platform we confirm our properties so as to never make a mistake but due diligence should be done on your part too, NO payments of rentals over Mobile or bank transfer to invisible people who claim to be out of town.\n6.	We implore you to sign a lease agreement over any property you want to move into before you move in, as a way to protect yourself\n7.	All properties advertised here cannot be legally binding to us for any fraud or illegal things after our advertisement and purchase of contacts.\n8.	When you add a property you promise that the property you added is available and you are the owner and/or have direct consent from the owner to advertise the property on their behalf, if you add a house that is not available, and try deceive our team members and any of our clients, you are liable to a lawsuit and compensation to both Consultancy Hub and each client any losses they may have encountered because of you.\n9.	You are not allowed to sell our contacts to others if you are caught doing so you are liable to getting sued, Or misrepresent us, using our name and/or names of our team members to trade in the same industry, that will be construed as trade mark infringement which is liable to lawsuit for every penny made in our name.\n10.	You are not to tarnish our name on any platform unless it is with good evidence presentable before a court of law, that we have denied you service for payment you made.\n11.	If we by any means treat you unprofessionally you come complain to our team first and we resolve the matter internally.\n12.	We Reserve our right to change and update our terms and conditions, as and when we deem necessary without notifying you, it is your duty to constantly check our terms and conditions and abide fully by them.\n13.	You agree to always and unconditionally abide by the rules and regulations of your host country, state or city, as you use our platform, failure to do so may lead to prosecution and Consultancy Hub is not liable to any of your actions.\n14) We allow certain third parties to advertise their products and services, whatever transactions you do with them, will not be legally bindind to Consultancy Hub because Consultancy Hub does not have any association with them, neither do they represent Consultancy Hub";                                        
                                            messageChain.delete(no);
                                            client.sendMessage(msg.from,messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                            }).catch((err) =>{
                                                console.log("Error on terms and conditions => " + err)
                                            });
                                        
                                        } else {
                                            
                                            messageToSend += "Please select one of the options above, by typing the number of the option you want, 1 or 2 or 3 or 4, \n\n\n#) To restart type #";
                                            console.log("It got into subscribed");
                                            client.sendMessage(msg.from,messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                            }).catch((err) =>{
                                                console.log("Error on second item => " + err)
                                            });
                                        }                                  
    
                                    } else {
                                        
                                        if(query == 0){
                                            messages.push(query);
                                            messageChain.set(no, messages);
                                            messageToSend += `${mainAd} \n\n1)Type 1 to be connected to our Sales Rep  \#) type # to Restart`;
                                
                                        } else if(query == 1){
                                            messages.push(query);
                                            messageChain.set(no, messages);
                                            messageToSend += `To give you a personalized service, we will ask you a few questions, please be patient, *you will only be asked these once*,\nKindly tell us where you are *coming from (moving from, even a relatives house)*, and a brief description of the property, we use this as part of the information in *your profile to match you* properties that might interest you, and add if its available *after you move(if not just type unavailable,check example)* others who are interested in moving there after you move may contact you for it, if its available after you move(Swap deals, these have great leverage to connect you with different people who might help you also find what you are looking for), if not type unavailable,\n\n*For example* 3 bed Avondale 400USD Harare, tiled, BIC, ceiling, walled and gated, available \n\n*Another example* 1 room Hillside 70USD Harare, normal floors, ceiling, is a bit small, unavailable \n\n\n#)Type *#* to restart`;
                                        } else if(query == 2){
                                            messages.push(query);
                                            messageChain.set(no, messages);
                                            messageToSend += "Thank you for choosing to work with us, please type the full details of the property here, rental price,suburb and city, description of the property(floor type, storage space(BIC), ceiling etc), security, water, size of the property, proximity to essential services like transport and supermarkets";
                                            
                                        } else if(query == 3){
                                            messages.push(query);
                                            messageChain.set(no, messages);
                                            messageToSend += "Our apologies for your inconviniences please type a detailed report of your experience and our team will attend to it promptly";
                                           
                                        } else if(query == 4){
                                            messages.push(query);
                                            messageChain.set(no, messages);
                                            messageToSend += "Terms and conditions as at 18.07.2021 \n 1.	Consultancy Hub is an advertising medium and does not own or manage the properties listed here, the properties shown are from either tenants moving from the property, landlords or agents who have no association with Consultancy Hub.\n2.	For extra details and pictures contact the person indicated on the property \n3.  You agree the other property you mentioned you were moving from,  is truly where you are coming from, and others might contact you, for your to help connect them to the landlord, without charging them any money.\n4.	You agree that you will not use the contacts from the NETWORK as a business for yourself or other people connected to you,\n5.	We are not a real estate company but a marketing platform we confirm our properties so as to never make a mistake but due diligence should be done on your part too, NO payments of rentals over Mobile or bank transfer to invisible people who claim to be out of town.\n6.	We implore you to sign a lease agreement over any property you want to move into before you move in, as a way to protect yourself\n7.	All properties advertised here cannot be legally binding to us for any fraud or illegal things after our advertisement and purchase of contacts.\n8.	When you add a property you promise that the property you added is available and you are the owner and/or have direct consent from the owner to advertise the property on their behalf, if you add a house that is not available, and try deceive our team members and any of our clients, you are liable to a lawsuit and compensation to both Consultancy Hub and each client any losses they may have encountered because of you.\n9.	You are not allowed to sell our contacts to others if you are caught doing so you are liable to getting sued, Or misrepresent us, using our name and/or names of our team members to trade in the same industry, that will be construed as trade mark infringement which is liable to lawsuit for every penny made in our name.\n10.	You are not to tarnish our name on any platform unless it is with good evidence presentable before a court of law, that we have denied you service for payment you made.\n11.	If we by any means treat you unprofessionally you come complain to our team first and we resolve the matter internally.\n12.	We Reserve our right to change and update our terms and conditions, as and when we deem necessary without notifying you, it is your duty to constantly check our terms and conditions and abide fully by them.\n13.	You agree to always and unconditionally abide by the rules and regulations of your host country, state or city, as you use our platform, failure to do so may lead to prosecution and Consultancy Hub is not liable to any of your actions.\n14) We allow certain third parties to advertise their products and services, whatever transactions you do with them, will not be legally bindind to Consultancy Hub because Consultancy Hub does not have any association with them, neither do they represent Consultancy Hub";
                                            messageChain.delete(no);
                                            
                                        } else {
                                            messageToSend += "Please select one of the options above, by typing the number of the option you want, 1 or 2 or 3 or 4, \n\n\n#) To restart type #";
                                        }
                                        
                                        
    
                                        client.sendMessage(msg.from,messageToSend).then((res) => {                                       
                                        
                                        }).catch((err) =>{
                                            console.log("Error on client welcome message => " + err)
                                        });
                                        
                                        
                                       
                                        
                                        
                                    }
                                }
                                break;
                            case 2:
                                
                                if(messages.length > 3){
                                    messageToSend += "Our apology there was a network error, kindly try again";
                                    messageChain.delete(no);
                                    client.sendMessage(msg.from,messageToSend).then((res) => {                                       
                                        
                                    }).catch((err) =>{
                                        console.log("Error on client welcome message => " + err)
                                    });
                                } else {
                                    if(clientMap.has(no)){  // Client is in system                                  
                                        if(messages[1] == 1){
                                            
                                            if(query == 1){

                                                if(myProperties.has(no)){
                                                    elastic.getRentalPropertyClientMatches(clientMap.get(no),myProperties.get(no).length).then((res) => {
                                                        
                                                        var noOfMessages = messageCounterMap.get(no);
                                                        noOfMessages++;
                                                        messageCounterMap.set(no,noOfMessages);
                                                        
                                                            
                                                        
                                                        var ad = getAd(no,noOfMessages);
                                                        // console.log(ad);
                                                        var advert = ad._source.adText;
                                                        var results = res.hits.hits;
                                                    
                                                        if(results.length > 0){
                                                            var properties = myProperties.get(no);
                                                            messageToSend += "These are the next 7 properties that best match your profile\n\n";
                                                            for(var i = 0;i < results.length;i++){
                                                                var info = results[i]._source;
                                                                messageToSend += `${info.beds} beds in ${info.suburb}  ${info.city} to let for *${info.rent}* \n${info.description} \nContact ${info.contact} \n\n`;
                                                                if(i == 0){
                                                                    messageToSend += `🔥🔥*HOT DEAL*🔥🔥\n ${advert}\n\n`;
                                                                }
                                                                if(i == 3){
                                                                    messageToSend += `🔥🔥*HOT DEAL*🔥🔥\n ${advert}\n\n`;
                                                                }
                                                                properties.push(info);
        
                                                            };
                                                            myProperties.set(no, properties);
                                                            messageToSend += "____________End_______________";
                                                            messageToSend += `\n*PlEASE type one the numbers below to select the next the option you want* e.g 2  \n1)Type 1 to see the next 7 properties \n2)Type 2 to update your search profile \n3)Type 3 to *SUBSCRIBE FOR FREE* \n4) Type 4 to *help others* \n5) *Experiences*(Share & Learn) \n#) Restart(type *#* to restart) \n\n\n🔥🔥 *HOT DEAL* 🔥🔥\n ${advert}`;
                                        
                                                            client.sendMessage(msg.from,messageToSend).then((res) => {
                                                                // console.log("Res " + JSON.stringify(res));
                                                                elastic.addHits(no).then((res) => {
                                                            
                                                                }).catch((err) =>{
                                                                    console.log("Error on hits item => " + err)
                                                                });
                                                            }).catch((err) =>{
                                                                console.log("Error on second item => " + err)
                                                            });
                                                        
                                                        } else {
                                                            messageToSend += `We do not have any more properties that match your profile at the moment, but you can check again later, see you soon, \nType # to restart \n\n\n😃 *SPONSORED* : ${mainAd}`;
                                                            client.sendMessage(msg.from,messageToSend).then((res) => {
                                                                // console.log("Res " + JSON.stringify(res));
                                                            }).catch((err) =>{
                                                                console.log("Error on posting a house => " + err)
                                                            });
                                                        }
            
                                                    }).catch((err) =>{
                                                        console.log("Error on second item => " + err)
                                                    });
                                                } else {
                                                    messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                                    messageChain.delete(no);
                                                    client.sendMessage(msg.from,messageToSend).then((res) => {
                                                        // console.log("Res " + JSON.stringify(res));
                                                    }).catch((err) =>{
                                                        console.log("Error on second item => " + err)
                                                    });
                                                }
                                            } else if(query == 2){
                                                messages.push(query);
                                                messageChain.set(no, messages);
                                                messageToSend += `To give you a personalized service, we will ask you a few questions, please be patient, *you will only be asked these once*,\nKindly tell us where you are *coming from (moving from, even a relatives house)*, and a brief description of the property, we use this as part of the information in *your profile to match you* properties that might interest you, and add if its available *after you move(if not just type unavailable,check example)* others who are interested in moving there after you move may contact you for it, if its available after you move(Swap deals), if not type unavailable,\n\n*For example* 3 bed Avondale 400USD Harare, tiled, BIC, ceiling, walled and gated, available \n\n*Another example* 1 room Hillside 70USD Harare, normal floors, ceiling, is a bit small, unavailable \n\n\n#)Type *#* to restart`;
                                                client.sendMessage(msg.from,messageToSend).then((res) => {                                       
                                        
                                                }).catch((err) =>{
                                                    console.log("Error on client welcome message => " + err)
                                                });
                                            } else if(query == 3){
                                                var now = new Date();
                                                var start = new Date(now.getFullYear(), 0, 0);
                                                var diff = now - start;
                                                var oneDay = 1000 * 60 * 60 * 24;
                                                var day = Math.floor(diff / oneDay); 
                                                elastic.addSubscription(no,clientMap.get(no),day).then((res) => {
                                                    if(res.result == "created"){
                                                        messageToSend += `Your subscription was successful! See you soon`;
                                                    } else {
                                                        messageToSend += `It appears there was an error adding your subscription, kindly select option 3 to file your report, and our team will attend to it`;
                                                    }
                                                    client.sendMessage(msg.from,messageToSend).then((res) => {                                       
                                                        messageChain.delete(no);
                                                    }).catch((err) =>{
                                                        console.log("Error on client welcome message => " + err)
                                                    });
                                                }).catch(console.log);
                                            } else if(query == 4){
                                                messages.push(query);
                                                messageChain.set(no, messages);
                                                messageToSend += `Thank you for choosing to help others, please type the details about the house including the landlord contact or agent contact \n\n\n#)Type *#* to restart`;
                                                client.sendMessage(msg.from,messageToSend).then((res) => {                                       
                                        
                                                }).catch((err) =>{
                                                    console.log("Error on client welcome message => " + err)
                                                });
                                            } else if(query == 5){
                                                messages.push(query);
                                                messageChain.set(no, messages);
                                                messageToSend += `This is the *best part of* Consultancy Hub, *Experiences* , share your experiences and also learn from the experience of others\n\n \n1)Type 1 share experiences with agents  \n2) Type 2 to see experiences of others with agents \n3) Type 3 to share experiences living in a suburb \n4) Type 4 to learn from experiences of other in suburbs that match your profile\n\n\n#)Type *#* to restart`;
                                                client.sendMessage(msg.from,messageToSend).then((res) => {                                       
                                        
                                                }).catch((err) =>{
                                                    console.log("Error on client welcome message => " + err)
                                                });
                                            } else {
                                                messageToSend += "Looks like you typed something else, did you mean to see the next 7 properties, type 1, or you need to restart, type # to restart \n\nType # to restart";
                                                client.sendMessage(msg.from,messageToSend).then((res) => {
                                                    // console.log("Res " + JSON.stringify(res));
                                                }).catch((err) =>{
                                                    console.log("Error on posting a house => " + err)
                                                });
                                            }
                                            
                                        
                                        } else if(messages[1] == 2){
                                            messageToSend += "Thank you for choosing to work with us, our team will be in touch with you *promptly*";
                                            client.sendMessage(msg.from,messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                                messageChain.delete(no);
                                                var mess = `${name} whose number is ${no} just added a property ${query}`
                                                client.sendMessage("263772263139@c.us",mess).then((res) => {
                                                    // console.log("Res " + JSON.stringify(res));
                                                    
                                                
                                                }).catch((err) =>{
                                                    console.log("Error on posting a house => " + err)
                                                })
                                            
                                            }).catch((err) =>{
                                                console.log("Error on posting a house => " + err)
                                            });
                                        } else if(messages[1] == 3){
                                            messageToSend += "Thank you for filling your *report* our team will be in touch with you *promptly*";
                                            
                                            client.sendMessage(msg.from,messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                                messageChain.delete(no);
                                                var mess = `${name} whose number is ${no} just added a report ${query}`
                                                client.sendMessage("263772263139@c.us",mess).then((res) => {
                                                    // console.log("Res " + JSON.stringify(res));
                                                    elastic.addRentalPropertyReports(no,query).then((res) => {
                                                        if(res.result == "created"){
                                                            console.log("Added report to database");
                                                        } else {
                                                            console.log("Error adding report to database => ");
                                                        }
    
                                                    }).catch((err) =>{
                                                        console.log("Error adding report to database => " + err);
                                                    })
                                                    
                                                
                                                }).catch((err) =>{
                                                    console.log("Error reporting report => " + err);
                                                })
                                            
                                            }).catch((err) =>{
                                                console.log("Error reporting report => " + err);
                                            });
                                        } else if(messages[1] == 0 && query == 1){
                                            messageToSend +=  `Thank you for reaching out, our sales rep will be in touch with you, *promptly*`;
                                            
                                            client.sendMessage(msg.from,messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                                var mess = `Good day, wa.me/${no.slice(0, -5)} is interested in furniture, click the link to talk to them`;
                                                client.sendMessage("263774407784@c.us",mess).then((res) => {                                       
                                        
                                                }).catch((err) =>{
                                                    console.log("Error on client welcome message => " + err)
                                                });
                                            }).catch((err) =>{
                                                console.log("Error on second item => " + err)
                                            });
                                        } else {
                                            
                                            messageToSend += "There was an error, please type # to restart";
                                            client.sendMessage(msg.from,messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                            }).catch((err) =>{
                                                console.log("Error on second item => " + err)
                                            });
                                        }
                                    } else {
                                        messages.push(query);
                                        messageChain.set(no, messages);
                                        if(messages[1] == 1){
                                            if(query.split(" ").join("").length < 10){
                                                messageToSend += "Please tell us again, where you are coming from, this time add more details, thank you \n\n\n#) To restart type #";
                                                client.sendMessage(msg.from,messageToSend).then((res) => {
                                                    // console.log("Res " + JSON.stringify(res));
                                                }).catch((err) =>{
                                                    console.log("Error on second item => " + err)
                                                });
                                            } else {
                                                if(messages[1] == 1){
                                                    messageToSend += "Please type a description of *what you are looking for*, the *more details the better* we match you to properties, also include your family size, *check examples* \n\nFor example: Newly married couple looking for 2 beds, with bic, ceiling, walled and gated,  \n\n*Another example* : Single lady looking for a big room, tiled, ceiling,own entrance and own bathroom and toilet   \n\n\n\n#) Restart(type *#* to restart)";
                                                    client.sendMessage(msg.from,messageToSend).then((res) => {
                                                        // console.log("Res " + JSON.stringify(res));
                                                        elastic.addRentalPropertyLeads(no,query).then((res) => {
                                                    
                                                            if(res.result == "created"){ 
                                                                console.log(`${name} added a lead their number is ${no}`);
                                                            } else {
                                                                console.log(`Could not add ${name}\'s lead to leads database their number ${no}`);
                                                            
                                                            }
                                                        
                                                        }).catch((err) =>{
                                                            console.log("Error addding client data => " + err)
                                                        });
                                                    }).catch((err) =>{
                                                        console.log("Error on second item => " + err)
                                                    });
                                                } else {
                                                    messageToSend += "This is not what you want? You can Restart(type *#* to restart) ";
                                                    client.sendMessage(msg.from,messageToSend).then((res) => {
                                                        // console.log("Res " + JSON.stringify(res));
                                                    }).catch((err) =>{
                                                        console.log("Error on report reporting => " + err)
                                                    });
                                                }
            
                                            
                                                
                                            }
                                        } else if(messages[1] == 2){
                                            messageToSend += "Thank you for choosing to work with us, our team will be in touch with you *promptly*";                                        
                                            client.sendMessage(msg.from,messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                                messageChain.delete(no);
                                                var mess = `${no} just added a property ${query}`
                                                client.sendMessage("263772263139@c.us",mess).then((res) => {
                                                    // console.log("Res " + JSON.stringify(res));
                                                }).catch((err) =>{
                                                    console.log("Error on posting a house => " + err)
                                                })
                                            
                                            }).catch((err) =>{
                                                console.log("Error on posting a house => " + err)
                                            });
                                        } else if(messages[1] == 3){
                                            messageToSend += "Thank you for filling your report our team will be in touch with you *promptly*";
                                            
                                            client.sendMessage(msg.from,messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                                messageChain.delete(no);
                                                var mess = `${no} just added a report ${query}`;
                                                client.sendMessage("263772263139@c.us",mess).then((res) => {
                                                    // console.log("Res " + JSON.stringify(res));
                                                    elastic.addRentalPropertyReports(no,query).then((res) => {
    
                                                        if(res.result == "created"){
                                                            console.log("Added a report into the database");
                                                        } else {
                                                            console.log("failed to add report into the database");
                                                        }
                                                    
                                                    }).catch((err) =>{
                                                        console.log("Error on adding a report => " + err)
                                                    })
                                                    
                                                
                                                }).catch((err) =>{
                                                    console.log("Error on posting a house => " + err)
                                                })
                                            
                                            }).catch((err) =>{
                                                console.log("Error on posting a house => " + err)
                                            });
                                        } else if(messages[1] == 0 && query == 1){
                                            messageToSend +=  `Thank you for reaching out, our sales rep will be in touch with you, *promptly*`;
                                            client.sendMessage(no,messageToSend).then((res) => {                                       
                                                var mess = `Good day, wa.me/${no.slice(0, -5)} is interested in furniture, click the link to talk to them`;
                                                client.sendMessage("263774407784@c.us",mess).then((res) => {                                       
                                            
                                                }).catch((err) =>{
                                                    console.log("Error on client welcome message => " + err)
                                                });
                                            }).catch((err) =>{
                                                console.log("Error on client welcome message => " + err)
                                            });
                                            
                                        } else {
                                            messageToSend += "There was an error please restart \n\n\n#) To restart type #";
                                            client.sendMessage(msg.from,messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                            }).catch((err) =>{
                                                console.log("Error on second item => " + err)
                                            });
                                        }
                                    }
                                }
                                
                                break; 
                            case 3:
                                messages.push(query);
                                messageChain.set(no, messages);
                                if(clientMap.has(no)  ){

                                    if(messages[2] == 2){
                                        messageToSend += "Please type a description of *what you are looking for*, the *more details the better* we match you to properties, also include your family size, *check examples* \n\nFor example: Newly married couple looking for 2 beds, with bic, ceiling, walled and gated,  \n\n*Another example* : Single lady looking for a big room, tiled, ceiling,own entrance and own bathroom and toilet   \n\n\n\n#) Restart(type *#* to restart)";
                                        client.sendMessage(msg.from,messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                            elastic.addRentalPropertyLeads(no,query).then((res) => {
                                        
                                                if(res.result == "created"){ 
                                                    console.log(`${name} added a lead their number is ${no}`);
                                                } else {
                                                    console.log(`Could not add ${name}\'s lead to leads database their number ${no}`);
                                                
                                                }
                                            
                                            }).catch((err) =>{
                                                console.log("Error addding client data => " + err)
                                            });
                                        }).catch((err) =>{
                                            console.log("Error on second item => " + err)
                                        });
                                    } else if(messages[2] == 4){
                                        messageToSend += "Thank you for choosing to work with us, our team will be in touch with you *promptly*";                                        
                                        client.sendMessage(msg.from,messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                            messageChain.delete(no);
                                            var mess = `${no} just added a potential property ${query}`
                                            client.sendMessage("263772263139@c.us",mess).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                            }).catch((err) =>{
                                                console.log("Error on posting a house => " + err)
                                            })
                                        
                                        }).catch((err) =>{
                                            console.log("Error on posting a house => " + err)
                                        });
                                    } else if(messages[2] == 5){ // Experiences
                                        
                                        if(query == 1){ // Add your experiences with agents
                                            messageToSend += `It is important to record your experiences with agents, so that others can learn how to deal with them, this will help people not to be scammed, and help people get the property of their choice quicker,please refrain from using vulgar language  \n\n\n#)Type *#* to restart`;
                                            client.sendMessage(msg.from,messageToSend).then((res) => {                                       
                                    
                                            }).catch((err) =>{
                                                console.log("Error add experiences with agents  => " + err)
                                            });
                                        } else if(query == 2){ // See experiences with agents
                                            
                                            var noOfMessages = messageCounterMap.get(no);
                                            noOfMessages++;
                                            messageCounterMap.set(no,noOfMessages);
                                            
                                                
                                            
                                            var ad = getAd(no,noOfMessages);
                                            // console.log(ad);
                                            var advert = ad._source.adText;
                                            
                                            elastic.getExpWithAgents(0).then((res) => {
                                                var results = res.hits.hits;
                                            
                                                if(results.length > 0){
                                                    var agentExpArray = [];
                                                    messageToSend += "These are some of the experiences of others with agents\n\n";
                                                    for(var i = 0;i < results.length;i++){
                                                        var info = results[i]._source;
                                                        
                                                        messageToSend += `\n\n${info.exp} \n\n`;
                                                        agentExpArray.push(info);
                                                        if(i == 1){
                                                            messageToSend += `🔥🔥*HOT DEAL*🔥🔥\n ${advert}\n\n`;
                                                        }
                                                    
                                                    };
                                                    agentExp.set(no, agentExpArray);
                                                    messageToSend += "____________End_______________";
                                                    messageToSend += `\n*PlEASE type one the numbers below to select the next the option you want* e.g 2  \n1)Type 1 to see the next 3 experiences  \n#) Restart(type *#* to restart)`;
                                
                                                    client.sendMessage(msg.from,messageToSend).then((res) => {

                                                    }).catch((err) =>{
                                                        console.log("Error on sending properties => " + err)
                                                    });
                                                
                                                } else {
                                                    messageToSend += `We do not have experiences at the moment, but more will be added, \nType # to restart \n\n\n😃 *SPONSORED* : ${mainAd}`;
                                                    client.sendMessage(msg.from,messageToSend).then((res) => {
                                                        // console.log("Res " + JSON.stringify(res));
                                                    }).catch((err) =>{
                                                        console.log("Error on posting a house => " + err)
                                                    });
                                                }

                                            }).catch(console.log);

                                        } else if(query == 3){ // Post Experiences
                                            messageToSend += `Please type the name and city of the suburb you have experience living in *check example* \nExample Msasa Park, Harare \nAnother example Glen Norah, Harare  \n\n\n#)Type *#* to restart`;
                                            client.sendMessage(msg.from,messageToSend).then((res) => {                                       
                                    
                                            }).catch((err) =>{
                                                console.log("Error add experiences with agents  => " + err)
                                            });
                                        } else if(query == 4){ // See sub experiences
                                            var noOfMessages = messageCounterMap.get(no);
                                            noOfMessages++;
                                            messageCounterMap.set(no,noOfMessages);
                                            
                                                
                                            
                                            var ad = getAd(no,noOfMessages);
                                            // console.log(ad);
                                            var advert = ad._source.adText;
                                            
                                            elastic.getExpBySub(0,clientMap.get(no)).then((res) => {
                                                var results = res.hits.hits;
                                            
                                                if(results.length > 0){
                                                    var subExpArray = [];
                                                    messageToSend += "These are some of the experiences of others in suburbs that match your profile\n\n";
                                                    for(var i = 0;i < results.length;i++){
                                                        var info = results[i]._source;
                                                        
                                                        messageToSend += `\n\n${info.exp} \n\n`;
                                                        subExpArray.push(info);
                                                        if(i == 1){
                                                            messageToSend += `🔥🔥*HOT DEAL*🔥🔥\n ${advert}\n\n`;
                                                        }
                                                    
                                                    };
                                                    subExp.set(no, subExpArray);
                                                    messageToSend += "____________End_______________";
                                                    messageToSend += `\n*PlEASE type one the numbers below to select the next the option you want* e.g 2  \n1)Type 1 to see the next 3 experiences  \n#) Restart(type *#* to restart)`;
                                
                                                    client.sendMessage(msg.from,messageToSend).then((res) => {

                                                    }).catch((err) =>{
                                                        console.log("Error on sending properties => " + err)
                                                    });
                                                
                                                } else {
                                                    messageToSend += `We do not have experiences at the moment, but more will be added, \nType # to restart \n\n\n😃 *SPONSORED* : ${mainAd}`;
                                                    client.sendMessage(msg.from,messageToSend).then((res) => {
                                                        // console.log("Res " + JSON.stringify(res));
                                                    }).catch((err) =>{
                                                        console.log("Error on posting a house => " + err)
                                                    });
                                                }

                                            }).catch(console.log);
                                        } 
                                        
                                        
                                    }
                                    
                                
                                } else {
                                    messageToSend += "You will only be *asked once*, please pay take your time, Please type a minimum of 3 suburbs, separated each by a comma *(check example)* , which interest you, \nFor example Avondale Harare,Belvedere Harare, Mabelreign Harare, \n\n*Another example* Avenues Harare,Hillside Harare, Eastlea Harare  \n\n\n\n#) Restart(type *#* to restart)";
                                    client.sendMessage(msg.from,messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch((err) =>{
                                        console.log("Error on second item => " + err)
                                    });
                                    
                                }
                                
                                
                                
                                
                                break;
                            case 4:
                                
                                if(clientMap.has(no)){

                                    if(messages[2] == 2){ // Updating your profile asking about suburbs
                                        messages.push(query);
                                        messageChain.set(no, messages);
                                        messageToSend += "You will only be *asked once*, please pay take your time, Please type a minimum of 3 suburbs, separated each by a comma *(check example)* , which interest you, \nFor example Avondale Harare,Belvedere Harare, Mabelreign Harare, \n\n*Another example* Avenues Harare,Hillside Harare, Eastlea Harare  \n\n\n\n#) Restart(type *#* to restart)";
                                        client.sendMessage(msg.from,messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch((err) =>{
                                            console.log("Error on second item => " + err)
                                        });
                                    } else if(messages[2] == 5){ // Experiences
                                         
                                        if(messages[3] == 1){ // Adding agent experiences
                                            messages.push(query);
                                            messageChain.set(no, messages);
                                            elastic.addExpWithAgents(no,query).then((res) => {

                                                if(res.result == "created"){
                                                    messageToSend += `Thank you for adding your experience, you have made life better for the next person  \n\n\n#)Type *#* to restart`;
                                                } else {
                                                    messageToSend += `It appears there was an error adding your experience, kindly select option 3 after the welcome message, to alert our team, so they can attend to it, immediately  \n\n\n#)Type *#* to restart`;
                                                }
                                                client.sendMessage(msg.from,messageToSend).then((res) => {                                       
                                                    messageChain.delete(no);
                                                }).catch((err) =>{
                                                    console.log("Error add experiences with agents  => " + err)
                                                });
                                            
                                            }).catch(console.log);
                                            
                                            
                                        } else if(messages[3] == 2){ // next agent experiences

                                            if(query == 1){
                                                if(agentExp.has(no)){
                                                    var noOfMessages = messageCounterMap.get(no);
                                                    noOfMessages++;
                                                    messageCounterMap.set(no,noOfMessages);
                                                    var ad = getAd(no,noOfMessages);
                                                    // console.log(ad);
                                                    var advert = ad._source.adText;
                                                    
                                                    elastic.getExpWithAgents(agentExp.get(no).length).then((res) => {
                                                        var results = res.hits.hits;
                                                    
                                                        if(results.length > 0){
                                                            var agentExpArray = agentExp.get(no);
                                                            messageToSend += "These are some of the experiences of others with agents\n\n";
                                                            for(var i = 0;i < results.length;i++){
                                                                var info = results[i]._source;
                                                                
                                                                messageToSend += `\n\n${info.exp} \n\n`;
                                                                agentExpArray.push(info);
                                                                if(i == 1){
                                                                    messageToSend += `🔥🔥*HOT DEAL*🔥🔥\n ${advert}\n\n`;
                                                                }
                                                            
                                                            };
                                                            agentExp.set(no, agentExpArray);
                                                            messageToSend += "____________End_______________";
                                                            messageToSend += `\n*PlEASE type one the numbers below to select the next the option you want* e.g 2  \n1)Type 1 to see the next 3 experiences  \n#) Restart(type *#* to restart)`;
                                        
                                                            client.sendMessage(msg.from,messageToSend).then((res) => {
    
                                                            }).catch((err) =>{
                                                                console.log("Error on sending properties => " + err)
                                                            });
                                                        
                                                        } else {
                                                            messageToSend += `We do not have any more experiences at the moment, but more will be added, \nType # to restart \n\n\n😃 *SPONSORED* : ${mainAd}`;
                                                            client.sendMessage(msg.from,messageToSend).then((res) => {
                                                                // console.log("Res " + JSON.stringify(res));
                                                            }).catch((err) =>{
                                                                console.log("Error on posting a house => " + err)
                                                            });
                                                        }
                                                    
                                                    }).catch(console.log);
                                                }
                                            } else {
                                                messageToSend += "Did you mean 1? or you want to restart, to restart type #, to see other experiences type 1";
                                                client.sendMessage(msg.from,messageToSend).then((res) => {
                                                    // console.log("Res " + JSON.stringify(res));
                                                }).catch((err) =>{
                                                    console.log("Error on second item => " + err)
                                                });
                                            }

                                            
                                            
                                        } else if(messages[3] == 3){ // Add suburb experiences 
                                            messages.push(query);
                                            messageChain.set(no, messages);
                                            messageToSend += `Please type the details of what is like to live there, you can add anything, like unity in the neighbourhood, security,water,transport, and other things you think are neccessary  \n\n\n#)Type *#* to restart`;
                                            client.sendMessage(msg.from,messageToSend).then((res) => {                                       
                                    
                                            }).catch((err) =>{
                                                console.log("Error add experiences with agents  => " + err)
                                            });
                                        } else if(messages[3] == 4){ // Next experiences by sub
                                            if(query == 1){
                                                if(subExp.has(no)){
                                                    var noOfMessages = messageCounterMap.get(no);
                                                    noOfMessages++;
                                                    messageCounterMap.set(no,noOfMessages);
                                                    var ad = getAd(no,noOfMessages);
                                                    // console.log(ad);
                                                    var advert = ad._source.adText;
                                                    
                                                    elastic.getExpBySub(subExp.get(no).length,clientMap.get(no)).then((res) => {
                                                        var results = res.hits.hits;
                                                    
                                                        if(results.length > 0){
                                                            var subExpArray = subExp.get(no);
                                                            messageToSend += "These are some of the experiences of others in suburbs\n\n";
                                                            for(var i = 0;i < results.length;i++){
                                                                var info = results[i]._source;
                                                                
                                                                messageToSend += `\n\n${info.exp} \n\n`;
                                                                subExpArray.push(info);
                                                                if(i == 1){
                                                                    messageToSend += `🔥🔥*HOT DEAL*🔥🔥\n ${advert}\n\n`;
                                                                }
                                                            
                                                            };
                                                            subExp.set(no, subExpArray);
                                                            messageToSend += "____________End_______________";
                                                            messageToSend += `\n*PlEASE type one the numbers below to select the next the option you want* e.g 2  \n1)Type 1 to see the next 3 experiences  \n#) Restart(type *#* to restart)`;
                                        
                                                            client.sendMessage(msg.from,messageToSend).then((res) => {
    
                                                            }).catch((err) =>{
                                                                console.log("Error on sending properties => " + err)
                                                            });
                                                        
                                                        } else {
                                                            messageToSend += `We do not have any more experiences at the moment, but more will be added, \nType # to restart \n\n\n😃 *SPONSORED* : ${mainAd}`;
                                                            client.sendMessage(msg.from,messageToSend).then((res) => {
                                                                // console.log("Res " + JSON.stringify(res));
                                                            }).catch((err) =>{
                                                                console.log("Error on posting a house => " + err)
                                                            });
                                                        }
                                                    
                                                    }).catch(console.log);
                                                } else {
                                                    messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                                    messageChain.delete(no);
                                                    client.sendMessage(msg.from,messageToSend).then((res) => {
                                                        // console.log("Res " + JSON.stringify(res));
                                                    }).catch((err) =>{
                                                        console.log("Error on second item => " + err)
                                                    });
                                                }
                                            } else {
                                                messageToSend += "Did you mean 1? or you want to restart, to restart type #, to see other experiences type 1";
                                                client.sendMessage(msg.from,messageToSend).then((res) => {
                                                    // console.log("Res " + JSON.stringify(res));
                                                }).catch((err) =>{
                                                    console.log("Error on second item => " + err)
                                                });
                                            }
                                        }
                                    }
                                    
                                } else {
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    if(messages[1] == 1){                                
                                        messageToSend += "Please pay attention you will only be asked this, *once*.What is your maximum budget? *Please select one of the options  below, by typing the number of the option*  \n\n\n1) Type 1 for 50USD and below \n2)Type 2 for 100USD and below \n3)Type 3 for 150USD and below \n4)Type 4 for 200USD and below \n5)Type 5 for 300USD and below \n6)Type 6 for 400USD and below \n7)Type 7 for 600USD and below \n8)Type 8 for 800USD and below  \n9)Type 9 for 1500USD and below \n10)Type 10 for 5000USD and below \n\n#) Restart(type *#* to restart)";
                                        client.sendMessage(msg.from,messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch((err) =>{
                                            console.log("Error on client welcome message => " + err)
                                        });
    
                                    } else {
                                        messageToSend += "There was an error please restart \n\n\n#) To restart type #";
                                        client.sendMessage(msg.from,messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch((err) =>{
                                            console.log("Error on second item => " + err)
                                        });
                                    }
                                }
                                
                                break;
                            case 5:
                                messages.push(query);
                                messageChain.set(no, messages);
                                if(clientMap.has(no)){

                                    if(messages[2] == 2){
                                        messageToSend += "Please pay attention you will only be asked this, *once*.What is your maximum budget? *Please select one of the options  below, by typing the number of the option*  \n\n\n1) Type 1 for 50USD and below \n2)Type 2 for 100USD and below \n3)Type 3 for 150USD and below \n4)Type 4 for 200USD and below \n5)Type 5 for 300USD and below \n6)Type 6 for 400USD and below \n7)Type 7 for 600USD and below \n8)Type 8 for 800USD and below  \n9)Type 9 for 1500USD and below \n10)Type 10 for 5000USD and below \n\n#) Restart(type *#* to restart)";
                                        client.sendMessage(msg.from,messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch((err) =>{
                                            console.log("Error on client welcome message => " + err)
                                        });
                                    } else if(messages[2] == 5){

                                        if(messages[3] == 3){
                                            elastic.addExpBySub(no,query,messages[4]).then((res) => {
                                                if(res.result == "created"){
                                                    messageToSend += `Thank you for adding your experience, you have made life better for the next person  \n\n\n#)Type *#* to restart`;
                                                } else {
                                                    messageToSend += `It appears there was an error adding your experience, kindly select option 3 after the welcome message, to alert our team, so they can attend to it, immediately  \n\n\n#)Type *#* to restart`;
                                                }
                                                client.sendMessage(msg.from,messageToSend).then((res) => {                                       
                                                    messageChain.delete(no);
                                                }).catch((err) =>{
                                                    console.log("Error add experiences with agents  => " + err)
                                                });

                                            }).catch(console.log);
                                        } else if(messages[3] == 4){
                                        
                                        }

                                    }
                                    
                                } else {
                                    if(messages[1] == 1){
                                        messageToSend += "How many bedrooms do you want(NB all rooms are under 1  bed)\n*Please select one of the options  below, by typing the number of the option e.g 5*  \n\n\n0) 0 bed( this is for all commercial property) \n1) 1 bed( all rooms that are 3 rooms and less are also included here) \n2) 2 beds \n3) 3 beds \n4) 4 beds \n5) 5 beds \n6) 6 beds \n7) 7 beds \n8) 8 beds \n9) 9 beds \n10) 10 beds \n#) This is not what you want? You can Restart(type *#* to restart) ";
                                        client.sendMessage(msg.from,messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch((err) =>{
                                            console.log("Error on second item => " + err)
                                        });
                                        
                                    } else {
                                        messageToSend += "This is not what you want? You can Restart(type *#* to restart) ";
                                        client.sendMessage(msg.from,messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch((err) =>{
                                            console.log("Error on report reporting => " + err)
                                        });
                                    }
                                }
                                
                                   
                                break;
                            case 6:
                                messages.push(query);
                                messageChain.set(no, messages);
                                if(clientMap.has(no) && messages[2] == 2){
                                    messageToSend += "How many bedrooms do you want(NB all rooms are under 1  bed)\n*Please select one of the options  below, by typing the number of the option e.g 5*  \n\n \n1) 1 bed( all rooms that are 3 rooms and less are also included here) \n2) 2 beds \n3) 3 beds \n4) 4 beds \n5) 5 beds \n6) 6 beds \n7) 7 beds \n8) 8 beds \n9) 9 beds \n10) 10 beds \n#) This is not what you want? You can Restart(type *#* to restart) ";
                                    client.sendMessage(msg.from,messageToSend).then((res) => {
                                         // console.log("Res " + JSON.stringify(res));
                                    }).catch((err) =>{
                                        console.log("Error on second item => " + err)
                                    });
                                } else {
                                    
                                    if(messages[1] == 1){
                                        
                                        if(messages[5] == 1){
                                            budget = 50;
                                        } else if(messages[5] == 2){
                                            budget = 100;
                                        } else if(messages[5] == 3){
                                            budget = 150;   
                                        } else if(messages[5] == 4){
                                            budget = 200;    
                                        } else if(messages[5] == 5){
                                            budget = 300;    
                                        } else if(messages[5] == 6){
                                            budget = 400;    
                                        } else if(messages[5] == 7){
                                            budget = 600;
                                        } else if(messages[5] == 8){
                                            budget = 800;   
                                        } else if(messages[5] == 9){
                                            budget = 1500;    
                                        } else if(messages[5] == 10){
                                            budget = 5000;    
                                        } 

                                        beds = parseInt(query);
                                        var clientObject = {
                                            budget: budget,
                                            beds: beds,
                                            name: name,
                                            whereFrom: messages[3],
                                            description: messages[4],
                                            suburbs: messages[5],
                                        }
                                        clientMap.set(no,clientObject);
                                        
                                        
                                        elastic.getRentalPropertyClientMatches(clientObject,0).then((res)=> {
                                            
                                            var noOfMessages = 0;
                                            noOfMessages++;
                                            messageCounterMap.set(no,noOfMessages);
                                            
                                                
                                            
                                            var ad = getAd(no,noOfMessages);
                                            // console.log(ad);
                                            var advert = ad._source.adText;
                                           
                                            var results = res.hits.hits;
                                            
                                            if(results.length > 0){
                                                var properties = [];
                                                messageToSend += "These are the properties that best match your profile\n\n";
                                                for(var i = 0;i < results.length;i++){
                                                    var info = results[i]._source;
                                                    messageToSend += `\n\n${info.beds} beds in ${info.suburb}  ${info.city} to let for *${info.rent}* \n${info.description} \nContact ${info.contact} \n\n`;
                                                    if(i == 0){
                                                        messageToSend += `🔥🔥*HOT DEAL*🔥🔥\n ${advert}\n\n`;
                                                    }
                                                    if(i == 3){
                                                        messageToSend += `🔥🔥*HOT DEAL*🔥🔥\n ${advert}\n\n`;
                                                    }
                                                    properties.push(info);

                                                };
                                                myProperties.set(no, properties);
                                                messageToSend += "____________End_______________";
                                                messageToSend += `\n*PlEASE type one the numbers below to select the next the option you want* e.g 2  \n1) Type 1 to see the next 7 properties \n#) Restart(type *#* to restart) \n\n\n🔥🔥 *HOT DEAL*🔥🔥\n ${advert}`;
                            
                                                client.sendMessage(msg.from,messageToSend).then((res) => {
                                                    // console.log("Res " + JSON.stringify(res));
                                                    elastic.addHits(no).then((res) => {
                                                            
                                                    }).catch((err) =>{
                                                        console.log("Error on hits item => " + err)
                                                    });
                                                }).catch((err) =>{
                                                    console.log("Error on second item => " + err)
                                                });
                                            
                                            } else {
                                                messageToSend += `We do not have properties that match your profile at the moment, but you can check again later, see you soon, \nType # to restart \n\n\n😃 *SPONSORED* : ${mainAd}`;
                                                client.sendMessage(msg.from,messageToSend).then((res) => {
                                                    // console.log("Res " + JSON.stringify(res));
                                                }).catch((err) =>{
                                                    console.log("Error on posting a house => " + err)
                                                });
                                            }
                                            
                                            elastic.addRentalPropertyClientOnSearch(no,name,messages[2],messages[3],messages[4],budget,beds).then((res)=> {
                                                
                                                if(res.result == "created"){
                                                    console.log("added client profile");
                                                } else {
                                                    console.log("Could not add client profile");
                                                }

                                            }).catch((error) => {
                                                console.log("Error adding client on search" + error.message);
                                            });
                                            
                                            

                                        
                                        
                                    

                                        }).catch((error) => {
                                            console.log("Error getting properties" + error.message);
                                        });
                                    
                                        
                                        
                                    } else {
                                        messageToSend += "This is not what you want? You can Restart(type *#* to restart) ";
                                        client.sendMessage(msg.from,messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch((err) =>{
                                            console.log("Error on report reporting => " + err)
                                        });
                                    }
                                }
                                
                                break;
                            case 7:
                                if(clientMap.has(no) && messages[2] == 2){

                                    if(messages[6] == 1){
                                        budget = 50;
                                    } else if(messages[6] == 2){
                                        budget = 100;
                                    } else if(messages[6] == 3){
                                        budget = 150;   
                                    } else if(messages[6] == 4){
                                        budget = 200;    
                                    } else if(messages[6] == 5){
                                        budget = 300;    
                                    } else if(messages[6] == 6){
                                        budget = 400;    
                                    } else if(messages[6] == 7){
                                        budget = 600;
                                    } else if(messages[6] == 8){
                                        budget = 800;   
                                    } else if(messages[6] == 9){
                                        budget = 1500;    
                                    } else if(messages[6] == 10){
                                        budget = 5000;    
                                    } 

                                    beds = parseInt(query);
                                    elastic.updateRentalPropertyClient(no,name,messages[3], messages[4],messages[5],budget,beds).then((res) => {
                                        if(res.result == "updated"){
                                            messageToSend += `Your profile has been successful updated`;
                                        } else {
                                            messageToSend += `There was an error updated your profile, please contact our team to attend to it, by selected option 3 to send a report`;
                                        }
                                        client.sendMessage(msg.from,messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                            messageChain.delete(no);
                                        }).catch((err) =>{
                                            console.log("Error on second item => " + err)
                                        });
                                    }).catch(console.log);

                                } else {
                                    if(query == 1){
                                    
                                        if(myProperties.has(no)){
                                            if(myProperties.get(no).length > 0){
    
                                                elastic.getRentalPropertyClientMatches(clientMap.get(no),myProperties.get(no).length).then((res)=> {
                                                    
                                                    var noOfMessages = messageCounterMap.get(no);
                                                    noOfMessages++;
                                                    messageCounterMap.set(no,noOfMessages);
                                                    
                                                        
                                                    
                                                    var ad = getAd(no,noOfMessages);
                                                    // console.log(ad);
                                                    var advert = ad._source.adText;
                                                    var results = res.hits.hits;
                                                    
                                                    if(results.length > 0){
                                                        var properties = myProperties.get(no);
                                                        messageToSend += "These are the next properties that best match your profile\n\n";
                                                        for(var i = 0;i < results.length;i++){
                                                            var info = results[i]._source;
                                                            messageToSend += `${info.beds} beds in ${info.suburb}  ${info.city} to let for *${info.rent}* \n${info.description} \nContact ${info.contact} \n\n`;
                                                            if(i == 0){
                                                                messageToSend += `🔥🔥*HOT DEAL*🔥🔥\n ${advert}\n\n`;
                                                            }
                                                            if(i == 3){
                                                                messageToSend += `🔥🔥*HOT DEAL*🔥🔥\n ${advert}\n\n`;
                                                            }
                                                            properties.push(info);
            
                                                        };
                                                        myProperties.set(no, properties);
                                                        messageToSend += "____________End_______________";
                                                        messageToSend += `\n*PlEASE type one the numbers below to select the next the option you want* e.g 2  \n1)Type 1 to see the next 7 properties \n#) Restart(type *#* to restart) \n\n\n🔥🔥 *HOT DEAL* 🔥🔥\n ${advert}`;
                                    
                                                        client.sendMessage(msg.from,messageToSend).then((res) => {
                                                            // console.log("Res " + JSON.stringify(res));
                                                            elastic.addHits(no).then((res) => {
                                                                
                                                            }).catch((err) =>{
                                                                console.log("Error on hits item => " + err)
                                                            });
                                                        }).catch((err) =>{
                                                            console.log("Error on second item => " + err)
                                                        });
                                                    
                                                    } else {
                                                        messageToSend += `We do not have properties that match your profile at the moment, but you can check again later, see you soon, \nType # to restart \n\n\n😃 *SPONSORED* : ${mainAd}`;
                                                        client.sendMessage(msg.from,messageToSend).then((res) => {
                                                            // console.log("Res " + JSON.stringify(res));
                                                        }).catch((err) =>{
                                                            console.log("Error on posting a house => " + err)
                                                        });
                                                    }
            
                                                }).catch((error) => {
                                                    console.log("Error getting properties" + error.message);
                                                });
                                            } else {
                                                messageToSend += "We do not have any more properties that match your profile at the moment, but you can check again later, see you soon,";
                                                client.sendMessage(msg.from,messageToSend).then((res) => {
                                                    // console.log("Res " + JSON.stringify(res));
                                                    messageChain.delete(no);
                                                }).catch((err) =>{
                                                    console.log("Error on posting a house => " + err)
                                                });
                                            }
                                        }
                                        
                                        
                                    } else {
                                        
                                        messageToSend += "Did you mean 1?, or you want to restart, type # to restart";
                                        client.sendMessage(msg.from,messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch((err) =>{
                                            console.log("Error on second item => " + err)
                                        });
                                    }
                                }
                                break;                          
                            default:
                                // Error message
                                messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                messageChain.delete(no);
                                client.sendMessage(msg.from,messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((err) =>{
                                    console.log("Error on second item => " + err)
                                });
                            break;
                            
                        }
                    
    
                }
            } else {

                
                
                elastic.getRentalPropertyClient(no).then((res) => {
                    
                    messages.push("first message");
                    messageChain.set(no,messages);

                    // Get Ads
                    getAds(no);
                    
                    if(res.hits.hits.length > 0) {
                        var result = res.hits.hits[0]._source;
                        
                        
                        var clientObject = {};                      
                        clientObject.budget = result.budget;
                        clientObject.beds = result.beds; 
                        clientObject.name = name;                         
                        clientObject.description = result.description;
                        clientObject.suburbs = result.suburbs;
                        clientObject.whereFrom = result.whereFrom;
                        
                        
                        clientMap.set(no,clientObject);
                        // console.log(clientObject);
                        
                        
                        var timeOfDay = "";
                        if(new Date().getHours() < 12){
                            timeOfDay = "Morning";
                        } else if(new Date().getHours() > 12 && new Date().getHours() < 16){
                            timeOfDay = "Afternoon";
                        } else {
                            timeOfDay = "Day";
                        }
                        
                         
                         messageToSend = `Pleasant ${timeOfDay} *${name}*, welcome back to Consultancy Hub \n\nPlease type one of the options below \n\n\n0) Type 0 for *FURNITURE* enquiry \n1) Type 1 to see available properties for rent \n2) Type 2 to find a tenant for your property \n3) Type 3 to file a report  \n4) Type 4 to see our terms and conditions as at 18.07.2021 \n\nBy using our platform you agreeing to terms and conditions as at 18.07.2021 \n\n\n 🔥🔥 *HOT DEAL* 🔥🔥\n ${mainAd}`;
                        client.sendMessage(msg.from,messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                            elastic.addVisitors(no).then((resp) => {
                            
                                if(resp.result == "created"){ 
                                    console.log(`${no} added as a visitor`);
                                } else {
                                    console.log(`Could not add ${no} to visitors database`);
                                
                                }
                            
                            }).catch((err) =>{
                                console.log("Error addding visitor data => " + err);
                            });
                        
                        }).catch((err) =>{
                            console.log("Error on client welcome message =>=> " + err)
                        });
                    } else {
                        messageToSend = `Welcome to Consultancy Hub  ${name}, You have reached our *SYSTEM*(Artificial Intelligence), here to walk with you so you get the best service, *please follow the instructions* so you can get the best benefit. \n\n\n0) Type 0 for *FURNITURE* enquiry \n1) Type 1 to see available properties for rent  \n2)Type 2 to find a tenant for your property \n3)Type 3 to report a problem \n4)Type 4 to see our terms and conditions as at 18.07.2021 \n\nBy using our platform you agree to our terms and conditions (T&Cs) as at 18.07.2021 \n\n\n\n\n 🔥🔥 *HOT DEAL* 🔥🔥: ${mainAd}`;
                        client.sendMessage(msg.from,messageToSend).then((res) => {
                            
                            
                            // console.log("Res " + JSON.stringify(res));
                            elastic.addUniqueVisitors(no).then((resp) => {
                            
                                if(resp.result == "created"){ 
                                    console.log(`${no} added as unique visitor`);
                                } else {
                                    console.log(`Could not add ${no} to visitors database`);
                                
                                }
                                
                            
                            }).catch((err) =>{
                                console.log("Error addding visitor data => " + err);
                            });
                            
                        
                        }).catch((err) =>{
                            console.log("Error on client welcome message => " + err);
                        });
                    }
                    

                }).catch((err) =>{
                    console.log("Error on welcome message => " + err);
                });               
             
            
                
            
            } 
       
        
    } 

     
});

client.on('status@broadcast', async status => {
    delete(status);
});


function getAds(no){ 

	
    elastic.getAds().then((res) => {

        // console.log(res.hits.hits);
        adsForClient.set(no,res.hits.hits);

        return res.hits.hits;

    }).catch(console.log);
	
	

	
 }


function getAd(no,messNo){
	
    if(adsForClient.has(no)) {
        var adsToSend = adsForClient.get(no);
    
        var ad = adsToSend[messNo % adsToSend.length];
        var hits = ad._source.hits;
        ad._source.hits = hits;
        
        elastic.updateHits(no,ad).then((res) => {
            if(res.result !== "updated"){
                console.log(`There was an error recording this hit`);
            } 
        
        }).catch(console.log);

        return ad;
    } else {
        var ad = {
            adText: mainAd,
        }

        return ad;

    }
    
    
	

}







app.use(cors());


app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(express.json());


app.post('/subs',(req,res) => {

    
    var message = req.body.message;
    var counter = req.body.counter;
    elastic.sendSubscription(counter).then((result) => {
        for(var i  = 0;i < result.hits.hits.length;i++){
			
			var no = result.hits.hits[i]._id;

            client.sendMessage(no,message).then((results) => {
                // console.log("Res " + JSON.stringify(res));
                console.log(`Subscriptions sent to ${no}`);
            }).catch((err) =>{
                console.log("Error => " + err)
            });
			
              
          }
          
          res.json(result);
    
    }).catch(console.log);
      
      
      
    

      

});

app.get('/leads', async (req, res) => {

  console.log(req.query.from);
  elastic.getLeads(req.query.from).then((result) => {
    res.json(result);
  }).catch(console.log);
  



});

app.post('/addrentalproperty',(req,res) => {
   
    elastic.addRentalProperty( 
            req.body.rent,
           req.body.suburb,
            req.body.city,
            req.body.beds,
            req.body.description,
           req.body.from,
            req.body.contact,
             req.body.author,
            req.body.day, //day of the year
          
      ).then((response) => {
        if(response.result == "created"){
            res.json({sent: true});
            console.log("Added properly");
          } else {
            console.log("Could not be added");
            res.json({sent: false});
          }
      }).catch(console.log);
      
     
        
      
    
  
  
  });
  
app.post('/addrentalproperty',(req,res) => {
   
    elastic.addRentalProperty( 
            req.body.rent,
           req.body.suburb,
            req.body.city,
            req.body.beds,
            req.body.description,
           req.body.from,
            req.body.contact,
             req.body.author,
            req.body.day, //day of the year
          
      ).then((response) => {
        if(response.result == "created"){
            res.json({sent: true});
            console.log("Added properly");
          } else {
            console.log("Could not be added");
            res.json({sent: false});
          }
      }).catch(console.log);
      
     
        
      
    
  
  
  });
  
  
  app.post('/addinsights',(req,res) => {
   
    elastic.addRentalInsights( 
            req.body.posts,
           req.body.channel,
            req.body.details,
            req.body.day, //day of the year
          
      ).then((response) => {
        if(response.result == "created"){
            res.json({sent: true});
            console.log("Added properly");
          } else {
            console.log("Could not be added");
            res.json({sent: false});
          }
      }).catch(console.log);
      
     
        
      
    
  
  
  });


app.post('/addproductleads',(req,res) => {
   
    elastic.addRentalProductLeads( 
            req.body.product,
           req.body.enquery,
            req.body.details,
            req.body.day, //day of the year
          
      ).then((response) => {
        if(response.result == "created"){
            res.json({sent: true});
            console.log("Added properly");
          } else {
            console.log("Could not be added");
            res.json({sent: false});
          }
      }).catch(console.log);
      
     
        
      
    
  
  
  });

app.post('/addcommsinsights',(req,res) => {
   
    elastic.addCommInsights( 
            req.body.product,
           req.body.comm,
            req.body.details,
            req.body.day, //day of the year
          
      ).then((response) => {
        if(response.result == "created"){
            res.json({sent: true});
            console.log("Added properly");
          } else {
            console.log("Could not be added");
            res.json({sent: false});
          }
      }).catch(console.log);
      
     
        
      
    
  
  
  });

app.post('/reset', async (req, res) => {
	
	console.log(req.body.dayForAgentLandlords)

  // TODO
  elastic.resetRentalProperty(req.body.dayForAgentLandlords).then((res) => {

   console.log(res)

  }).catch(console.log);
  


});

app.get('/getrentalproperty', async (req, res) => {
	
	if(req.query.by == 1){
		var resp = await elastic.getRentalPropertybyDescription(req.query.description);	
		console.log(resp)
		res.json(resp);
	} else if(req.query.by == 2){
		var resp = await elastic.getRentalPropertyByContact(req.query.contact);
		res.json(resp);
		
	}

});

app.post('/deleterentalpropertybyid', async (req, res) => {
	

	var id = req.body.id;
  // TODO
  elastic.deleteRentalProperty(id).then((resp) => {

   res.json(resp);

  }).catch(console.log);
  


});


app.listen(port, () => {
    console.log("Server Running Live on Port : " + port);
});
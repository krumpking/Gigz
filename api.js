const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs');
const axios = require('axios');
const shelljs = require('shelljs');
const qrcode = require('qrcode-terminal');
const { Client, MessageMedia } = require('whatsapp-web.js');
const config = require('./config.json');
const { Paynow } = require("paynow");
const randomString = require('random-string');
const cors = require('cors');
const system = require('system-commands');
const firebase = require('./services/firebase.js');
const mongoWorker = require('./services/workerService.js');
const mongoGig = require('./services/gigService.js');
const Worker = require('./models/workerModel.js');
const Gig = require('./models/gigModel.js');
const Review = require('./models/reviewsModel.js');
const initConnection = require('./config/config');
var mongoose = require('mongoose');
const Twitter = require('twitter');
const FB = require('fb');



initConnection();





process.title = "whatsapp-node-api";
global.client = new Client({ qrTimeoutMs: 0, puppeteer: { headless: true } });
///
global.authed = false;
const app = express();


/**
 *  Initiating paynow
 */
const paynow = new Paynow("4114", "857211e6-052f-4a8a-bb42-5e0d0d9e38e7");

const ACCESS_TOKEN = "EAAFnbEUHkZAsBAGZCxNq7wKhNrOoln7hDtPGXE8Axn2WZBhrRndo4RKWLdpHEuBrothGAWRlEEB0ywunx6X6k4ZC0MsZBOZAj20xRMlwCOkBAe8dmpsxaKgCbZBp1ZCdVsZB6XiBIOkpqGyQd9tZAXDSZCyGEVOM7xxxBEy2ssZChcFCvEQax0Kq89mEAWigBDEv4aas1UuzTXD8gAZDZD";

//Initialize Twitter 
var twitter = new Twitter({
    consumer_key: "Zc4QD26rL8u2RIRaexplwufjg",
    consumer_secret: "QHp46Mxx1jVlgPxQ782UCPqhJ5MeX99SKDMZSdtP7oXVEoIPZD",
    access_token_key: "1413157886566535182-3kC9tBGE59mhxsr5o23NjhWuJEfKJO",
    access_token_secret: "VMsSY66ko5y23ijJxdix18uCQlWL9dXcOmozU08ikBj2D"
});


const port = process.env.PORT || config.port;
//Set Request Size Limit 50 MB

client.initialize();

client.on('qr', qr => {
    // console.log("initialize QR")
    qrcode.generate(qr, { small: true });
    // fs.writeFileSync('./components/last.qr', qr);
});



client.on('authenticated', (session) => {
    console.log("AUTH HAS WORKED!");

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
var myGigsMap = new Map();
var seenGigzMap = new Map();
var mainAd = "#Believe";
var subCounter = 0;
var adsForClient = new Map();
var messageCounterMap = new Map();
var invoice = new Date().getTime().toString();
var pollUrl = "";
const zwlPrice = 400;

client.on('message', async msg => {

    if (msg.from.length < 23) {

        /// A unique identifier for the given session
        const sessionId = randomString({ length: 20 });
        const query = msg.body;
        const no = msg.from;



        const user = await msg.getContact();

        var name = user.pushname;
        if (name === undefined || name === Object.keys(user).length === 0) {
            name = "";
        }


        // array message
        var messageToSend = "";
        var messages = [];


        // check if user has sent a message to the app before
        if (messageChain.has(no)) {
            messages = messageChain.get(no);



            if (query == "#") {
                messageToSend += "You have reset now.\nType hi message to continue or click link below \nhttps://wa.me/263713020524?text=hie";
                messageChain.delete(no);
                messages = [];
                client.sendMessage(msg.from, messageToSend).then((res) => {
                    // console.log("Res " + JSON.stringify(res));
                }).catch((e) => {
                    console.error(e);
                    messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";

                    client.sendMessage(msg.from, messageToSend).then((res) => {
                        // console.log("Res " + JSON.stringify(res));
                    }).catch((err) => {
                        console.error(err);
                    });
                });
            } else if (query.toLowerCase() == "unsubscribe" || query.toLowerCase() == "unsubs" || query.toLowerCase() == "unsub") {
                mongoWorker.unsubscribe(no).then((res) => {
                    messageToSend += "It was an honor to serve you, all the best in the next part of your journey";
                    messageChain.delete(no);
                    messages = [];
                    client.sendMessage(msg.from, messageToSend).then((res) => {
                        // console.log("Res " + JSON.stringify(res));
                    }).catch((err) => {
                        console.log(e);
                        messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                        messageChain.delete(no);
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                        }).catch(console.error);
                    });

                }).catch(console.error);
            } else if (query.toLowerCase() == "buy") {
                messages = [];
                messageChain.delete(no);
                messages.push("First message");
                messageChain.set(no, messages);
                messageToSend += "Please enter your ecocash number, it works the same way as in a supermarket, you enter your number and you get a prompt to enter your PIN  e.g 0777123123,   \n\nYou can Restart(type *#* to restart) ";
                client.sendMessage(msg.from, messageToSend).then((res) => {
                    // console.log("Res " + JSON.stringify(res));
                }).catch(console.error);
            } else if (query.substring(query.indexOf('@') + 1, query.length).length === 13 && query.substring(0, query.indexOf('@')) === "bid") { // bid for a gig
                messageChain.delete(no);
                messages = [];
                mongoWorker.getWorker(no).then((v) => {
                    if (v != null) {
                        clientMap.set(no, v);
                        if (v.bids > 0) {

                            mongoGig.findGig(query.substring(query.indexOf('@') + 1, query.length)).then((v) => {

                                if (v != null) {
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    myGigsMap.set(no, v);
                                    let el = v;
                                    messageToSend += `This is the gig you want to bid for \n\nBudget:${el.budget}USD ${el.paymentStructure} \n${el.details}  \n${getDaysDifference(el.finalDay)} day(s) left to bid \n\n`;
                                    messageToSend += `Type your bid(a message with your application/proposal for the gig(job)) for the gig, this means basically, typing to the person offering the gig, why they should work with you and not anyone else,type bid(proposal/application) right after this message,whatever you type after this message is going to be sent to the person who posted this gig \n\nIf this is not what you want type # to restart`;
                                } else {
                                    messageToSend += `The gig you typed has not been found, please check the link again or type # to restart`;
                                }


                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                }).catch(console.error);


                            }).catch((e) => {
                                console.error(e);
                                messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                messageChain.delete(no);
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);

                            });

                        } else {
                            messageToSend += `It appears you are out of bids, you can buy more bids just 100RTGS Ecoash for 5 bids,to buy type Buy or click this link to https://wa.me/263713020524?text=Buy `;
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                            }).catch(console.error);
                        }

                    } else {
                        messageToSend += `It appears you do not have any account with us, to able to bid you need to have an account, to create an account, after this message, type hi, and select option 2 `;
                        messageChain.delete(no);
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                        }).catch(console.error);
                    }

                }).catch(console.error);

            } else if (query.substring(query.indexOf('@') + 1, query.length - 17) === "accept" && query.substring(0, query.indexOf('@')).length === 13) { // accept bid 
                messageChain.delete(no);
                messages = [];
                messages.push(query);
                messageChain.set(no, messages);
                mongoGig.findGig(messages[0].substring(messages[0].indexOf('t') + 1, messages[0].indexOf('@gig'))).then((gig) => {
                    myGigsMap.set(no, gig);
                    if (gig.acceptingTimes > 0) {
                        var id = messages[0].substring(0, messages[0].indexOf('@'));
                        mongoWorker.getWorkerById(id).then((v) => {
                            messageToSend += `Congratulations your bid was accepted, you will can contact the person who posted the gig on ${gig.get(no).no.substring(0, no.indexOf('@'))}, remember to ask them to give you review, as that will improve your chances of getting more and more gigz and build your reputation`;
                            client.sendMessage(v[0].no, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                                //TODO remove one from acceptedTimes
                                var mess = `Thank you accepting this person's bid, you can contact the person who made the bid(proposal/application) on ${v[0].no.substring(0, no.indexOf('@'))} , remember to leave a review after the work is done, this helps the person build their reputation and helps them connect with other people who need the same work done \nTo Review click https://wa.me/263713020524?text=${v[0].id}@rate`;
                                client.sendMessage(no, mess).then((res) => {

                                }).catch(console.error);
                            }).catch(console.error);
                            var mediaMessage = "Take advantage of the affidavit sent to you, to sign agreement before the work starts";
                            const media = MessageMedia.fromFilePath('./gigzaffidavit.pdf');
                            client.sendMessage(v[0].no, media, { caption: mediaMessage }).catch(console.error);
                            client.sendMessage(no, media, { caption: mediaMessage }).catch(console.error);
                            messageChain.delete(no);
                            messages = [];
                            mongoGig.removeAcceptTimes(gig).catch(console.error);

                        }).catch((e) => {
                            console.error(e);
                            messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                            messageChain.delete(no);
                            messages = [];
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);

                        });
                    } else {
                        messageToSend += `We are glad we managed to connect you with talent for your gig, we charge a small 9% finders fee, to notify the talent you have chosen them, kindly type pay to pay finder\'s fee, \nTo pay, type the ecocash number you are using to pay, e.g 0713020524, \n(Payment works like in a supermarket, after putting the number you will get a prompt on your phone to put in your PIN)`;
                        client.sendMessage(no, messageToSend).then((res) => {
                        }).catch(console.error);
                    }

                }).catch((e) => {
                    console.error(e);
                    messageToSend += "Oooops looks like there was an error, initiating payment, please try again, by sending click the accept link ";
                    messageChain.delete(no);
                    client.sendMessage(msg.from, messageToSend).then((res) => {
                        // console.log("Res " + JSON.stringify(res));
                    }).catch(console.error);

                });


            } else if (query.substring(query.indexOf('@') + 1, query.length) === "profile" && query.substring(0, query.indexOf('@')).length === 13) { // see proposal bidder profile
                messages = [];
                messageChain.delete(no);
                var id = query.substring(0, query.indexOf('@'));
                mongoWorker.getWorkerById(id).then((v) => {
                    messageToSend += `Full Name: ${v.name} \nBrief:${v.brief} \nSkills: ${v.skills} \nAreas able to work: ${v.areas} \nTo see their work history click \nhttps://wa.me/263713020524?text=${v.id}@history \nTo see their reviews click \nhttps://wa.me/263713020524?text=${v.id}@reviews`;
                    client.sendMessage(v.no, messageToSend).then((res) => {
                        // console.log("Res " + JSON.stringify(res));
                    }).catch(console.error);

                }).catch((e) => {
                    console.log(e);
                    messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                    messageChain.delete(no);
                    client.sendMessage(msg.from, messageToSend).then((res) => {
                        // console.log("Res " + JSON.stringify(res));
                    }).catch(console.error);
                });
            } else if (query.substring(query.indexOf('@') + 1, query.length) === "reviews" && query.substring(0, query.indexOf('@')).length === 13) { // see proposal bidder reviews
                messageChain.delete(no);
                messages = [];
                var id = query.substring(0, query.indexOf('@'));
                mongoWorker.getWorkerReviews(id).then((v) => {
                    messageToSend += `These are the last 7 reviews from the last few gigz this person worked on\n\n`
                    v.forEach((e) => {
                        messageToSend += `Budget ${e.budget} \n${e.details} \n${e.skills} \n\n`;
                    });
                    messageToSend += `________________END_______________________`;
                    client.sendMessage(msg.from, messageToSend).then((res) => {

                    }).catch(console.error);


                }).catch((e) => {
                    console.error(e);
                    messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                    messageChain.delete(no);
                    client.sendMessage(msg.from, messageToSend).then((res) => {
                        // console.log("Res " + JSON.stringify(res));
                    }).catch(console.error);

                });
            } else if (query.substring(query.indexOf('@') + 1, query.length) === "history" && query.substring(0, query.indexOf('@')).length === 13) { // see worker history
                messageChain.delete(no);
                messages = [];
                var id = query.substring(0, query.indexOf('@'));
                mongoGig.getWorkerHistory(id).then((v) => {
                    messageToSend += `These are the last 7 gigz this person worked on\n\n`
                    v.forEach((e) => {
                        messageToSend += `Review \n${e.review} \n\n`;
                    });
                    messageToSend += `________________END_______________________`;
                    client.sendMessage(msg.from, messageToSend).then((res) => {

                    }).catch(console.error);


                }).catch((e) => {
                    console.error(e);
                    messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                    messageChain.delete(no);
                    client.sendMessage(msg.from, messageToSend).then((res) => {
                        // console.log("Res " + JSON.stringify(res));
                    }).catch(console.error);
                });
            } else if (query.substring(query.indexOf('@') + 1, query.length) === "rate" && query.substring(0, query.indexOf('@')).length === 13) { // see proposal bidder reviews
                messageChain.delete(no);
                messages = [];
                messages.push(query);
                messageChain.set(no, messages);
                messageToSend += `Thank you for rating the service you got, can you please type briefly what was your experience working with this person`;
                client.sendMessage(msg.from, messageToSend).then((res) => {

                }).catch(console.error);

            } else {

                switch (messages.length) {
                    case 1:
                        if (messages.length > 2) {
                            messageToSend += "Our apology there was a network error, kindly try again";
                            messageChain.delete(no);

                        } else {
                            if (query === "2" || query === "4") {
                                messages.push(query);
                                messageChain.set(no, messages);

                                mongoWorker.getWorker(no).then((v) => {
                                    if (v != null) {
                                        clientMap.set(no, v);
                                        if (clientMap.has(no) && query === "2") {

                                            var seenGigz = [];
                                            mongoGig.getGigz(v.skills, v.category, 0).then((r) => {

                                                if (r.length > 0) {
                                                    messageToSend += "These are the gigz available right now\n\n";
                                                    r.forEach((el) => {
                                                        messageToSend += `${el.details} \nBudget:${el.budget}USD ${el.paymentStructure}  \n${getDaysDifference(el.finalDay)} day(s) left to bid\nTo Bid for this gig click this link https://wa.me/263713020524?text=bid@${el.id} \n\n`;
                                                        seenGigz.push(el);
                                                    });
                                                    seenGigzMap.set(no, seenGigz);
                                                    messageToSend += "_________________END_________________\n";
                                                    messageToSend += `Please select one of the option below \n1)To see the next batch of gigz type 1  \n\nType # to restart  \n\n${mainAd}`;
                                                } else {
                                                    messageToSend += `It appears there are no gigz that match your skills at the moment, please try again tomorrow, we will send you a message when something comes up \n${mainAd}`;
                                                    messageChain.delete(no);
                                                }

                                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                                    // console.log("Res " + JSON.stringify(res));
                                                }).catch(console.error);

                                            }).catch(console.error);




                                        } else {
                                            if (query === "4") {
                                                messageToSend += `Please answer the next few questions to update your account, you will only be asked once \nPlease tell us your name  \n\nIf this is not what you want type # to restart`;
                                            } else {
                                                messageToSend += `It appears you are yet to create an account, please answer the next few questions, you will only be asked once \nPlease tell us your name  \n\nIf this is not what you want type # to restart`;
                                            }

                                            client.sendMessage(msg.from, messageToSend).then((res) => {

                                            }).catch((e) => {
                                                console.error(e);
                                                messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                                messageChain.delete(no);
                                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                                    // console.log("Res " + JSON.stringify(res));
                                                }).catch(console.error);
                                            });
                                        }
                                    } else {
                                        if (query === "4") {
                                            messageToSend += `Please answer the next few questions to update your account, you will only be asked once \nPlease tell us your full name \n\nIf this is not what you want type # to restart`;
                                        } else {
                                            messageToSend += `It appears you are yet to create an account, please answer the next few questions, you will only be asked once \nPlease tell us your full name, \n\nIf this is not what you want type # to restart`;
                                        }

                                        client.sendMessage(msg.from, messageToSend).then((res) => {

                                        }).catch((e) => {
                                            console.error(e);
                                            messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                            messageChain.delete(no);
                                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                            }).catch(console.error);
                                        });
                                    }

                                }).catch(console.error);




                            } else if (query === "0") {
                                messageToSend += "Gigz is a Whatsapp system, it has automated responses.Our Dream is to bring your dream to reality using software as a service \nOur goal is to give you *PEACE OF MIND*, by making it easy for you to work with *GENUINE* people, whether you are looking for an agent to help you find *ACCOMODATION*, or you need a *MECHANIC* , a *CARPENTER*, someone to *FIX YOUR PHONE*, a *DRIVER*, or any service you need, we make this happen by giving you the opportunity to post a gig(piece job), and once you do, you will receive messages we call bids(Offers on how the service providers can help you), and you select the person to work with, based on the person's offer, profile, work history or reviews,\nTo see how this works, type hie, and after the welcome message type 5   \n\nOur second goal which is equaly important is give genuine hard working people opportunities to find gigz(job) and make money, but beyond that to build a *REPUTATION*, which will help them make more money in the future, or open doors for them in other avenues, you build a *REPUTATION* by getting reviews from work done, and your work history,\nWe all have various *Gifts and skills*, anyone can register your skills, whether you are in sales, in marketing, can fix cars, you are a letting agent, you are a chef, or a cook or a baker, or you drive a truck or a taxi,our dream is that you grow and make your dream come true  \nTo see how this works type hi, and after the welcome message, type 5  \n\nGet started with us, type start, and select any of the options on the welcome page";
                                messageChain.delete(no);
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);
                            } else if (query === "8") {
                                messages.push(query);
                                messageChain.set(no, messages);

                                firebase.getRentalPropertyClientMatches().then((querySnapshot) => {



                                    if (querySnapshot.empty) {
                                        messageToSend += `We do not have any available properties at the moment, but if you set up a gig(piece job for someone to look for accommodation on your behalf) you will get messages when a property that likely matches what you want and Gigz will link you up with the person(agent/landlord/other third party) who has that property, \nType # to restart \n\n${mainAd}`;
                                    } else {


                                        messageToSend += "These are the properties we know of right now\n\n";
                                        var properties = [];
                                        querySnapshot.forEach((doc) => {

                                            var info = doc.data();
                                            messageToSend += `\n${info.description} \nTo get contacts, type # to restart, then type hie, then select option 5 to see How Gigz work \n\n`;
                                            properties.push(info);

                                        });
                                        lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];


                                        myProperties.set(no, lastVisible);
                                        messageToSend += "____________End_______________";
                                        messageToSend += `\n*PlEASE type one the numbers below to select the next the option you want* e.g 2  \n1)Type 1 to see the next 7 properties \n#) Restart(type *#* to restart) \n\n\n${mainAd}`;

                                    }
                                    client.sendMessage(msg.from, messageToSend).then((res) => {

                                    }).catch((err) => {
                                        console.log("Error on sending properties => " + err)
                                    });


                                }).catch((err) => {
                                    console.log(err);
                                    messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                    messageChain.delete(no);
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch((err) => {
                                        console.log("Error on second item => " + err)
                                    });
                                });

                            } else if (query === "1") {
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend += "Can you type the details of what you need to be done and where the work will done, PLEASE be detailed  ,eg I need someone to fix my fridge, it is emperial one door has been working and suddenly went quiet I suspect a power short cucuit OR I need a truck to help move my good from Mabelreign to Malborough about 12km distance I have delicate furniture OR I need someone to look for accomodation for me in Kuwadzana my budget is 350, tiled,walled and gated preffered etc, OR I need some to make a website for my company, just 5 pages describing what we do, I will send you the company information in Harare";
                                client.sendMessage(msg.from, messageToSend).then((res) => {

                                }).catch(console.error);

                            } else if (query === "3") {
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend += "Please type the gig you are looking for eg soccer OR accomodation  OR house keeping  OR farming  ";
                                client.sendMessage(msg.from, messageToSend).then((res) => {

                                }).catch(console.error);
                            } else if (query === "5") {
                                messages.push(query);
                                messageChain.set(no, messages);
                                var messageToSend = "Please select one of the options below  \n1) Type 1 is you do not know what a gig is? \n2) Type 2 if you are looking for house to rent and you do not know what to do \n3) Type 3 if you are want to register but do not know what to do \n4) Type 4 if you want to post a gig and you do not know what to do \n5) Type 5 if you want a pdf that has frequently asked questions";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);

                            } else if (query === "6") {
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend += "Thank you for sending us feedback, please type a detailed report of your experience and our team will attend to it promptly";
                                client.sendMessage(msg.from, messageToSend).then((res) => {

                                }).catch(console.error);
                            } else if (query === "7") {
                                var mediaMessage = "Gigz Terms and Conditions";
                                const media = MessageMedia.fromFilePath('./t&cs.pdf');
                                messageChain.delete(no);
                                client.sendMessage(no, media, { caption: mediaMessage }).catch(console.error);


                            } else if (query.toLowerCase() == "buy") {
                                let payment = paynow.createPayment(invoice, "anelesiwawa@gmail.com");
                                payment.add("Bids", 100);
                                paynow.sendMobile(

                                    // The payment to send to Paynow
                                    payment,

                                    // The phone number making payment 
                                    query.toString(),

                                    // The mobile money method to use. 
                                    'ecocash'

                                ).then((v) => {

                                    if (v.success) {
                                        pollUrl = v.pollUrl;
                                        messages.push(query);
                                        messageChain.set(no, messages);
                                        messageToSend += "After you set your PIN, type paid so we can confirm your payment or click https://wa.me/263713020524?text=paid   \n\nYou can Restart(type *#* to restart) ";
                                    } else {
                                        messageToSend += "It appears there was an error, please type your number again, to retry   \n\nYou can Restart(type *#* to restart) ";
                                    }
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch((err) => {
                                        console.log("Error on report reporting => " + err)
                                    });
                                }).catch((e) => {
                                    console.log(e);
                                    messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                    messageChain.delete(no);
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch((err) => {
                                        console.log("Error on second item => " + err)
                                    });


                                });

                            } else if (messages[0].substring(messages[0].indexOf('@') + 1, messages[0].length) === "rate" && messages[0].substring(0, messages[0].indexOf('@')).length == 13) {
                                var id = messages[0].substring(0, messages[0].indexOf('@'));

                                var review = new Review({
                                    reviewer_no: no,
                                    review: query,
                                    date: new Date,
                                    reviewed_person_id: id
                                });

                                mongoWorker.addReview(review).then((v) => {

                                    if (v == null) {
                                        messageToSend += "It looks like you have already reviewed this person, set up a new gig to hire them again \n\n\n#) To restart type #";
                                    } else {
                                        messageToSend += "Review was successfully added, thank you, We hope you use our service again \n\n\n#) To restart type #";
                                    }

                                    client.sendMessage(msg.from, messageToSend).then((res) => {

                                    }).catch(console.error);


                                });
                            } else if (messages[0].substring(messages[0].indexOf('@') + 1, messages[0].length).length === 13 && messages[0].substring(0, messages[0].indexOf('@')) === "bid") {
                                if (myGigsMap.has(no)) {

                                    if (isValid(query) && isValidEmail(query)) {
                                        messageToSend += "It appears your bid contains some content that is not allowed, it may contain a phone number or email, these are not allowed, please try again without including these";
                                        client.sendMessage(msg.from, messageToSend).then((res) => {

                                        }).catch(console.error);
                                    } else {
                                        var messageToSend = `New Bid Alert! \n${query} \n\nPLEASE REMEMBER TO RATE the work after the work is button is below to use later \n\nTo accept click this link and send it https://wa.me/263713020524?text=${clientMap.get(no).id}@accept${myGigsMap.get(no).id}@gig \n\nTo see this person's profile copy the link and send it https://wa.me/263713020524?text=${clientMap.get(no).id}@profile \n\nTo see this person's reviews copy link and send it https://wa.me/263713020524?text=${clientMap.get(no).id}@reviews `;
                                        client.sendMessage(myGigsMap.get(no).no, messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                            let message = `Your bid has been sent, you will get a response if your bid is accepted`;
                                            client.sendMessage(no, message).then((res) => {
                                                // console.log("Res " + JSON.stringify(res)); 
                                                messageChain.delete(no);
                                                mongoWorker.reduceWorkerBids(no).then((v) => { }).catch(console.error);

                                            }).catch(console.error);


                                        }).catch(console.error);
                                    }

                                } else {
                                    messageToSend += `It appears this gig has is not available, please try again, or contact us by using the feedback option after the welcome message type # to restart`;
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        messageChain.delete(no);
                                    }).catch(console.error);
                                }
                            } else if (messages[0].substring(messages[0].indexOf('@') + 1, messages[0].length - 17) === "accept" && messages[0].substring(0, messages[0].indexOf('@')).length == 13) { // accept bid ){

                                if (isValid(query)) {
                                    let payment = paynow.createPayment(invoice, "anelesiwawa@gmail.com");
                                    let price = myGigsMap.get(no).budget * zwlPrice * 0.09;

                                    payment.add("Bids", parseInt(price));
                                    paynow.sendMobile(

                                        // The payment to send to Paynow
                                        payment,

                                        // The phone number making payment 
                                        query.toString(),

                                        // The mobile money method to use. 
                                        'ecocash'

                                    ).then((v) => {

                                        if (v.success) {
                                            pollUrl = v.pollUrl;
                                            console.log(pollUrl);
                                            messages.push(query);
                                            messageChain.set(no, messages);
                                            messageToSend += "After typing your Ecocash PIN type paid so we can confirm your payment or click https://wa.me/263713020524?text=paid   \n\nYou can Restart(type *#* to restart) ";

                                        } else {
                                            messageToSend += "It appears there was an error, please type your number again, to retry   \n\nYou can Restart(type *#* to restart) ";
                                        }
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch(console.error);
                                    }).catch((e) => {
                                        console.error(e);
                                        messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                        messageChain.delete(no);
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch(console.error);


                                    });



                                } else {
                                    messageToSend += "Oooops looks like you did not type in a phone number, to pay you need to type in the phone number,type the phone number you are going to use to pay \n\nIf this is not what you want type # to restart";

                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);
                                }



                            } else {

                                messageToSend += "Please select one of the options above, by typing the number of the option you want, 1 or 2 or 3 or 4, \n\n\n#) To restart type #";

                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((err) => {
                                    console.log("Error on second item => " + err)
                                });
                            }


                        }
                        break;
                    case 2:

                        if (messages.length > 3) {
                            messageToSend += "Our apology there was a network error, kindly try again";
                            messageChain.delete(no);
                            client.sendMessage(msg.from, messageToSend).then((res) => {

                            }).catch((err) => {
                                console.log("Error on client welcome message => " + err)
                            });
                        } else {

                            if (messages[1] === "8") {

                                if (query == "1") {

                                    if (myProperties.has(no)) {

                                        firebase.getRentalNextPropertyClientMatches(myProperties.get(no)).then((querySnapshot) => {

                                            if (querySnapshot.empty) {
                                                messageToSend += `We do not have any available properties at the moment, but if you set up a gig(piece job for someone to look for accommodation on your behalf) you will get messages when a property that likely matches what you want and Gigz will link you up with the person(agent/landlord/other third party) who has that property, \nType # to restart \n\n${mainAd}`;
                                            } else {
                                                var properties = [];
                                                messageToSend += "These are the properties we know of right now\n\n";

                                                querySnapshot.forEach((doc) => {

                                                    var info = doc.data();
                                                    messageToSend += `\n${info.description} \nTo get contacts, type # to restart, then type hie, then select option 5 to see How Gigz work \n\n`;
                                                    properties.push(info);


                                                });
                                                myProperties.delete(no);
                                                lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
                                                myProperties.set(no, lastVisible);
                                                messageToSend += "____________End_______________";
                                                messageToSend += `\n*PlEASE type one the numbers below to select the next the option you want* e.g 2  \n1)Type 1 to see the next 7 properties \n#) Restart(type *#* to restart) \n\n${mainAd} `;

                                            }
                                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                            }).catch((err) => {
                                                console.log("Error on second item => " + err)
                                            });


                                        }).catch((err) => {
                                            console.log(e);
                                            messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                            messageChain.delete(no);
                                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                            }).catch((err) => {
                                                console.log("Error on second item => " + err)
                                            });
                                        });
                                    } else {
                                        messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                        messageChain.delete(no);
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch((err) => {
                                            console.log("Error on second item => " + err)
                                        });
                                    }
                                } else {
                                    messageToSend += "Looks like you typed something else, did you mean to see the next 7 properties, type 1, or you need to restart, type # to restart \n\nType # to restart";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch((err) => {
                                        console.log("Error on posting a house => " + err)
                                    });
                                }


                            } else if (messages[1] === "1") {

                                if (validateEmail(query) || isValid(query)) {
                                    messageToSend += "It appears your details contains contacts or some other content that is not allowed, please ensure to add only details about the work you need done \n\nRestart(type *#* to restart) ";
                                    client.sendMessage(no, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);
                                } else {
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    messageToSend += "Can you type you budget for this gig in USD(How much you will pay the person who does will do the gig), only a number is allowed e.g 50 , \nNB Gigz charges a ONCE-OFF 9% finders fee after you get the bid(proposal/application) that fits what you need, that means if your budget is 50USD you pay only 4USD Ecocash equivalent paid right no your phone, the prompt will be shown when you are ready to accept a bid \n\nIf this is not what you want type # to restart";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);
                                }

                            } else if (messages[1] == "6") {
                                messageToSend += "Thank you for sending feedback your *report* our team will be in touch with you *promptly*";

                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                    messageChain.delete(no);


                                }).catch(console.error);

                                var mess = `${name} whose number is ${no} just added a report ${query}`;
                                client.sendMessage("263771376220@c.us", mess).then((res) => {

                                }).catch(console.error);

                            } else if (messages[1] === "2" || messages[1] === "4") {

                                if (clientMap.has(no) && messages[1] === "2") {

                                    if (query === "1") {

                                        // get the next batch of gigz 
                                        var seenGigz = seenGigzMap.get(no);
                                        mongoGig.getGigz(clientMap.get(no).skills, clientMap.get(no).category, seenGigz.length).then((v) => {

                                            if (v.length > 0) {
                                                messageToSend += "These are the next batch of gigz available right now\n\n";
                                                v.forEach((el) => {
                                                    messageToSend += `${el.details} \nBudget:${el.budget}USD ${el.paymentStructure}  \n${getDaysDifference(el.finalDay)} day(s) left to bid \nTo Bid for this gig click this link https://wa.me/263713020524?text=bid@${el.id} \n\n`;
                                                    seenGigz.push(el);
                                                });
                                                seenGigzMap.set(no, seenGigz);
                                                messageToSend += "___________________END_________________________\n";
                                                messageToSend += "Please select one of the option below \n1)To see the next batch of gigz type 1  \n\nType # to restart ";
                                            } else {
                                                messageToSend += `It appears there are no more gigz that match your skills at the moment, please try again tomorrow, we will send you a message when something comes up \n${mainAd}`;
                                                messageChain.delete(no);
                                            }
                                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                            }).catch(console.error);

                                        }).catch(console.error);

                                    } else {
                                        messageToSend += `This response is outside of the ones expected, please click on the link of the gig of you choice, or type 1 to see next batch of gigz, or type # to restart`;
                                        client.sendMessage(msg.from, messageToSend).then((res) => {

                                        }).catch(console.error);

                                    }

                                } else {
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    messageToSend += `Please select the category of your occupation by typing the number of the category e.g 3,or clicking the link below it \n\n1)Administration, business and management\nhttps://wa.me/263713020524?text=1 \n\n2)Animals, land and environment\nhttps://wa.me/263713020524?text=2 \n\n3)Architecture\nhttps://wa.me/263713020524?text=3 \n\n4)Computing and ICT\nhttps://wa.me/263713020524?text=4 \n\n5)Construction and building\nhttps://wa.me/263713020524?text=5 \n\n6)Design, arts and crafts\nhttps://wa.me/263713020524?text=6 \n\n7)Education and training\nhttps://wa.me/263713020524?text=7 \n\n8)Energy production services\nhttps://wa.me/263713020524?text=8 \n\n9)Engineering\nhttps://wa.me/263713020524?text=9  \n\n10)Facilities and property services\nhttps://wa.me/263713020524?text=10 \n\n11)Farming, Fishing, and Forestry\nttps://wa.me/263713020524?text=11 \n\n12)Financial services\nhttps://wa.me/263713020524?text=12 \n\n13)Garage services\nhttps://wa.me/263713020524?text=13  \n\n14)Hairdressing and beauty https://wa.me/263713020524?text=14 \n\n15)Healthcare\nhttps://wa.me/263713020524?text=15  \n\n16)Heritage, culture and libraries\nhttps://wa.me/263713020524?text=16  \n\n17)Hospitality, catering and tourism \nhttps://wa.me/263713020524?text=17 \n\n18)Languages \nhttps://wa.me/263713020524?text=18 \n\n19)Legal and court services\nhttps://wa.me/263713020524?text=19 \n\n20)Manufacturing and production\nhttps://wa.me/263713020524?text=20 \n\n21)Mining and extraction services\nhttps://wa.me/263713020524?text=21  \n\n22)Performing arts and media \nhttps://wa.me/263713020524?text=22   \n\n23)Print and publishing, marketing and advertising \nhttps://wa.me/263713020524?text=23  \n\n24)Retail and customer services\nhttps://wa.me/263713020524?text=24  \n\n25)Science, mathematics and statistics \nhttps://wa.me/263713020524?text=25 \n\n26)Security, uniformed and protective services \nhttps://wa.me/263713020524?text=26 \n\n27)Social sciences and religion\nhttps://wa.me/263713020524?text=27 \n\n28)Social work and caring services\nhttps://wa.me/263713020524?text=28 \n\n29)Sport and leisure \nhttps://wa.me/263713020524?text=29 \n\n30)Transport, distribution and logistics\nhttps://wa.me/263713020524?text=30  \n\n#) Restart(type # to restart)`;
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);

                                }

                            } else if (messages[1] === "3") {
                                messages.push(query);
                                messageChain.set(no, messages);
                                var seenGigz = [];
                                mongoGig.searchGigz(query, 0).then((v) => {

                                    if (v.length > 0) {
                                        messageToSend += "These are the gigz available right now\n\n";
                                        v.forEach((el) => {
                                            messageToSend += `${el.details} \nBudget:${el.budget}USD ${el.paymentStructure} \n${getDaysDifference(el.finalDay)} day(s) left to bid \nTo Bid for this gig click this link https://wa.me/263713020524?text=bid@${el.id} \n\n`;
                                            seenGigz.push(el);
                                        });
                                        seenGigzMap.set(no, seenGigz);
                                        messageToSend += "___________________END_________________________\n";
                                        messageToSend += "Please select one of the option below \n1)To see the next batch of gigz type 1  \n\nType # to restart ";
                                    } else {
                                        messageToSend += "It appears we do not have gigz that match what you are looking for right now, you can search for other kind of gigz by reselecting option 3, or you can try again later";
                                        messageChain.delete(no);
                                    }
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);

                                }).catch(console.error);


                            } else if (messages[1].toLowerCase() === "buy") {
                                if (query.toLowerCase() === "paid") {
                                    let status = await axios.get(pollUrl);
                                    if (status.data.includes("status=Paid") || status.data.includes("status=Awaiting Delivery") || status.data.includes("status=Delivered")) {
                                        mongoWorker.addWorkerBids(no).then((v) => {
                                            messageToSend += "Your payment was successful, we have added 5 bids to your account \n\nRestart(type *#* to restart) ";
                                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                            }).catch((err) => {
                                                console.log("Error on report reporting => " + err)
                                            });
                                        }).catch((e) => {
                                            console.log(e);
                                            messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                            messageChain.delete(no);
                                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                            }).catch((err) => {
                                                console.log("Error on second item => " + err)
                                            });
                                        });
                                    } else if (status.data.includes("status=Sent")) {
                                        messageToSend += "It is taking a bit more time to confirm your payment, please wait 2 minutes and type paid again \n\nRestart(type *#* to restart) ";
                                        client.sendMessage(no, messageToSend).then((res) => {
                                            // console.error("Res " + JSON.stringify(res));
                                        }).catch(console.error);

                                    } else {
                                        messageToSend += "It appears your payment was not successful,kindly contact the team if you paid, so we can credit your account,to contact us, type # and after the welcome message, type 3, to send a report \nYou can Restart(type *#* to restart) ";
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch((err) => {
                                            console.log("Error on report reporting => " + err)
                                        });
                                    }



                                } else {
                                    messageToSend += "This is not what you want? You can Restart(type *#* to restart) ";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch((err) => {
                                        console.log("Error on report reporting => " + err)
                                    });

                                }
                            } else if (messages[1] === "5") {
                                messageChain.delele(no);
                                if (query === "1") {
                                    var messageToSend = "A gig is a job usually for a specified time, a once-off job, a once-off contract ";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);
                                } else if (query === "2") {
                                    var messageToSend = "Gigz help you get accomodation through posting a gig \nA gig is like asking someone to look/search for accomodation for you, and you pay them after they get you a property, you are the one who decides what's the best amount you would want to give to the person who helps you.So you post the gig on the Whatsapp system.We have people who are registered who can help you, so when they see your gig, they send you a message of what they have and you decide to accept that house/room or not, and select the one you like, and after you choose the person who will help you, you also get a chance to come back and write a review about them, you also are encouraged to sign an affidavit with the person so you have better protection from being scammed \nThe option to post a gig is option 1 on the welcome message, so to post a gig, type hi, then type 1 and answer the few questions that follow  \n\nWe also understand that you may not like the first house/room you see, so we have made our finders fee effectivelly a subscription, \nwhere if your budget for the person who will help you is less than 10, once you pay finders fee you get connected to up to 3 houses/rooms of your choice you get connect automatically the moment you accept a bid(How to accept a bid is explained on the bid message), \nIf you budget is between 10 and 30 you also get to choose up to 7 houses/rooms of your choice automatically after you make your payment  \nIf you budget is above 30 you get connected to landlords/agents/other tenants of up to 13 houses/rooms  \nThis finders fee will be valid for as long as your gig is still running and you have been connected to less houses/rooms than the above mentioned.Meaning it will last for as long as you want it to N.B We encourage you to have a gig for atleast 3 weeks, to ensure you find the place to call your home \nAlso you can post a gig for someone to help you move, when you have to move";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);
                                } else if (query === "3") {
                                    var messageToSend = "To become part of our database of our you have to register, to register, you have to type option 2 on the welcome message, to do that from here, type hi, and type 2 , and answer the questions that follow, you will be asked what is your name, and to select the category of your occupation , then you will be asked your skills ,and about yourself and then the areas you like to work in, that is all ";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);
                                } else if (query === "4") {
                                    var messageToSend = "Posting a gig means posting a part time job/small one-off jobs, and it allows you to work with genuine people, who you are review after the work is done, to post a gig, type hi, then type 1 and answer the few questions that follow, you will be asked what you need to get done, and your budget for the gig and the last day for people to send you messages ";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);
                                } else if (query === "5") {
                                    var mediaMessage = "Take advantage of the Gigs today #Believe";
                                    const media = MessageMedia.fromFilePath('./FAQs.pdf');
                                    client.sendMessage(no, media, { caption: mediaMessage }).catch(console.error);

                                } else {
                                    const media = MessageMedia.fromFilePath('./FAQs.pdf');
                                    client.sendMessage(no, media, { caption: mediaMessage }).catch(console.error);
                                }
                            } else if (messages[0].substring(messages[0].indexOf('@') + 1, messages[0].length - 17) === "accept" && messages[0].substring(0, messages[0].indexOf('@')).length === 13) { // accept bid ){
                                if (query.toLowerCase() === "paid") {
                                    let status = await axios.get(pollUrl);
                                    if (status.data.includes("status=Paid") || status.data.includes("status=Awaiting Delivery") || status.data.includes("status=Delivered")) {
                                        // sent to the person who proposed, and when they accept, remind them again to review worker later, and add to the proposers work history
                                        var id = messages[0].substring(0, messages[0].indexOf('@'));
                                        mongoWorker.getWorkerById(id).then((v) => {
                                            messageToSend += `Congratulations your bid was accepted, you will can contact the person who posted the gig on ${myGigsMap.get(no).no.substring(0, no.indexOf('@'))}, remember to ask them to give you review, as that will improve your chances of getting more and more gigz and build your port-folio`;
                                            client.sendMessage(v[0].no, messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                                var mess = `Thank you accepting this person's bid, you can contact the person who made the proposal on ${v[0].no.substring(0, no.indexOf('@'))} , remember to leave a review after the work is done, this helps the person build a portfolio and helps them connect with other people who need the same work done \nTo Review click https://wa.me/263713020524?text=${v[0].id}@rate`;
                                                client.sendMessage(no, mess).then((res) => {

                                                }).catch(console.error);
                                            }).catch(console.error);
                                            var mediaMessage = "Take advantage of the affidavit sent to you, to sign agreement before the work starts";
                                            const media = MessageMedia.fromFilePath('./gigzaffidavit.pdf');
                                            client.sendMessage(v[0].no, media, { caption: mediaMessage }).catch(console.error);
                                            client.sendMessage(no, media, { caption: mediaMessage }).catch(console.error);
                                            messageChain.delete(no);


                                            if (myGigsMap.get(no).category === "Facilities and property services"
                                                && myGigsMap.get(no).skills.includes("accommodation") || myGigsMap.get(no).skills.includes("real estate")
                                                || myGigsMap.get(no).skills.includes("agent")) {

                                                if (parseInt(myGigsMap.get(no).budget) < 10) {
                                                    mongoGig.addAcceptTimes(myGigsMap.get(no), 3).catch(console.error);
                                                } else if (parseInt(myGigsMap.get(no).budget) > 10 && parseInt(myGigsMap.get(no).budget) < 30) {
                                                    mongoGig.addAcceptTimes(myGigsMap.get(no), 7).catch(console.error);
                                                } else if (parseInt(myGigsMap.get(no).budget) > 30) {
                                                    mongoGig.addAcceptTimes(myGigsMap.get(no), 13).catch(console.error);
                                                }
                                            }



                                        }).catch((e) => {
                                            console.error(e);
                                            messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                            messageChain.delete(no);
                                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                                // console.log("Res " + JSON.stringify(res));
                                            }).catch(console.error);

                                        });
                                    } else if (status.data.includes("status=Sent")) {
                                        messageToSend += "It is taking a bit more time to confirm your payment, please wait 2 minutes and type paid again \n\nRestart(type *#* to restart) ";
                                        client.sendMessage(no, messageToSend).then((res) => {
                                            // console.error("Res " + JSON.stringify(res));
                                        }).catch(console.error);

                                    } else {
                                        messageToSend += "It appears your payment was not successful,kindly contact the team if you paid, so we can connect you, type # and after the welcome message, type 6, to send feedback \nYou can Restart(type *#* to restart) ";
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch(console.error);

                                    }
                                } else {
                                    messageToSend += "This is not what you want? You can Restart(type *#* to restart) ";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);

                                }


                            } else {

                                messageToSend += "There was an error, please type # to restart";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);
                            }

                        }

                        break;
                    case 3:
                        if (messages[1] === "2" || messages[1] === "4") {

                            if (clientMap.has(no) && messages[1] === "2") {

                                if (myGigsMap.has(no)) {
                                    messageToSend += `New Bid Alert! \n${query} \n\nTo accept bid click \nhttps://wa.me/263713020524?text=${clientMap.get(no).id}@accept${myGigsMap.get(no).id}@gig \nTo See this person's profile click \nhttps://wa.me/263713020524?text=${clientMap.get(no).id}@profile \nTo see this person's reviews click \nhttps://wa.me/263713020524?text=${clientMap.get(no).id}@review \nTo leave a review of a person's work, PLEASE REMEMBER TO RATE the work after the work is done click \nhttps://wa.me/263713020524?text=${clientMap.get(no).id}@rate`;
                                    client.sendMessage(myGigsMap.get(no).no, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                        let message = `Your Bid has been sent, you will get a response if your bid is accepted`;
                                        client.sendMessage(msg.from, message).then((res) => {
                                            // console.log("Res " + JSON.stringify(res)); 

                                            mongoWorker.reduceWorkerBids(no).catch(console.error);;

                                        }).catch(console.error);
                                        messageChain.delete(no);


                                    }).catch(console.error);
                                } else {
                                    messageToSend += "This is not what you want? You can Restart(type *#* to restart) ";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);
                                }



                            } else {
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend += "Please type your skills, separate each skill by a comma, type ALL your skills that you believe you can earn from, e.g cooking, dancing, web development,decor, grooming and etiquitte, \n\nIf this is not what you want type # to restart ";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);

                            }
                        } else if (messages[1] === "3") {
                            if (query === "1") {
                                var seenGigz = seenGigzMap.get(no);
                                mongoGig.searchGigz(messages[2], seenGigz.length).then((v) => {
                                    if (v.length > 0) {
                                        messageToSend += "These are the gigz available right now\n\n";
                                        v.forEach((el) => {
                                            messageToSend += `${el.details} \nBudget:${el.budget}USD ${el.paymentStructure} \n${getDaysDifference(el.finalDay)} day(s) left to bid \nTo Bid for this gig click this link https://wa.me/263713020524?text=bid@${el.id} \n\n`;
                                            seenGigz.push(el);
                                        });
                                        seenGigzMap.set(no, seenGigz);
                                        messageToSend += "___________________END_________________________\n";
                                        messageToSend += "Please select one of the option below \n1)To see the next batch of gigz type 1  \n\nType # to restart";
                                    } else {
                                        messageToSend += "It appears we do not have anymore gigz you are searching for, you can change what you are searching for or check again tomorrow";
                                    }

                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);
                                }).catch(console.error);

                            } else {
                                messageToSend += `This response is outside of the ones expected, please click on the link of the gig of you choice, or type 1 to see next batch of gigz, or type # to restart`;
                                client.sendMessage(msg.from, messageToSend).then((res) => {

                                }).catch(console.error);
                            }
                        } else if (messages[1] === "1") {

                            if (isNumeric(query)) {
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend += "Can you type your intended payment structure e.g upfront , half down, balance on delivery, after work is done,";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);
                            } else {
                                messageToSend += "Can you type you budget for this gig(job) in USD, only a number is allowed e.g 50 \n\nIf this is not what you want type # to restart";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);
                            }

                        } else {
                            messageToSend += "This is not what you want? You can Restart(type *#* to restart) ";
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);
                        }

                        break;
                    case 4:
                        if (messages[1] === "2" || messages[1] === "4") {
                            messages.push(query);
                            messageChain.set(no, messages);
                            messageToSend += "Type a brief intro about yourself, to help you stand out from everyone that may be interested in the same gig as you, you may want to include in this, your education history and work history, and what inspires you";
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);



                        } else if (messages[1] === "1") {
                            messages.push(query);
                            messageChain.set(no, messages);
                            messageToSend += "When is the final day for receiving bids(messages from people interested in thiS gig(job) the best time is normally *atleast* 7 days and for those looking for houses/rooms for rent we believe 14 days from today is recommended for best results), use this format MM-DD-YYYY e.g 12-25-2022 \n\nIf this is not what you want type # to restart";
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);

                        } else {
                            messageToSend += "This is not what you want? You can Restart(type *#* to restart) ";
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);
                        }
                        break;
                    case 5:
                        if (messages[1] === "2" || messages[1] === "4") {

                            messages.push(query);
                            messageChain.set(no, messages);
                            messageToSend += "Please type the areas your are able to work in, include suburb and city, e.g Avondale, Harare, Epworth Harare";
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);
                        } else if (messages[1] === "1") {


                            if (isValidDate(query) && getDaysDifference(query) < 366) {
                                messages.push(query);
                                messageChain.set(no, messages);

                                var milliSecondsSinceEpoch = new Date().valueOf().toString();

                                var gig = new Gig({
                                    details: messages[2],
                                    budget: messages[3],
                                    paymentStructure: messages[4],
                                    finalDay: new Date(messages[5]),
                                    id: milliSecondsSinceEpoch,
                                    no: no,
                                    date: new Date(),
                                    approved: false,
                                    winner: "none"
                                });

                                mongoGig.addGig(gig).then((v) => {
                                    var id = mongoose.Types.ObjectId(v._id).toString();
                                    if (id != "" && id != null) {
                                        messageToSend += "Your gig was added successfully, our team will approve it shortly, and you will start receving bids from interested parties, the instructions to accept a proposal will be in the proposal message sent to you";
                                    } else {
                                        messageToSend += "There was an error adding your gig, please try again, You can Restart(type *#* to restart)  ";
                                    }
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                        messageChain.delete(no);

                                    }).catch(console.error);

                                }).catch((e) => {
                                    console.error(e);
                                    messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                    messageChain.delete(no);
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);
                                });

                            } else {
                                messageToSend += "It appears you entered an invalid date, or a date more or less than 366 days away \n\nIf this is not what you want type # to restart";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);
                            }


                        } else {
                            messageToSend += "This is not what you want? You can Restart(type *#* to restart) ";
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);
                        }
                        break;
                    case 6:
                        if (messages[1] == "2" || messages[1] === "4") {


                            messages.push(query);
                            messageChain.set(no, messages);
                            let milliSecondsSinceEpoch = new Date().valueOf().toString();

                            var category = "";

                            switch (messages[3]) {
                                case "1":
                                    category = "Administration, business and management";
                                    break;
                                case "2":
                                    category = "Animals, land and environment";
                                    break;
                                case "3":
                                    category = "Architecture";
                                    break;
                                case "4":
                                    category = "Computing and ICT";
                                    break;
                                case "5":
                                    category = "Construction and building";
                                    break;
                                case "6":
                                    category = "Design, arts and crafts";
                                    break;
                                case "7":
                                    category = "Education and training";
                                    break;
                                case "8":
                                    category = "Energy production services";
                                    break;
                                case "9":
                                    category = "Engineering";
                                    break;
                                case "10":
                                    category = "Facilities and property services";
                                    break;
                                case "11":
                                    category = "Farming, Fishing, and Forestry";
                                    break;
                                case "12":
                                    category = "Financial services";
                                    break;
                                case "13":
                                    category = "Garage services";
                                    break;
                                case "14":
                                    category = "Hairdressing and beauty";
                                    break;
                                case "15":
                                    category = "Healthcare";
                                    break;
                                case "16":
                                    category = "Heritage, culture and libraries";
                                    break;
                                case "17":
                                    category = "Hospitality, catering and tourism";
                                    break;
                                case "18":
                                    category = "Languages";
                                    break;
                                case "19":
                                    category = "Legal and court services";
                                    break;
                                case "20":
                                    category = "Manufacturing and production";
                                    break;
                                case "21":
                                    category = "Mining and extraction services";
                                    break;
                                case "22":
                                    category = "Performing arts and media";
                                    break;
                                case "23":
                                    category = "Print and publishing, marketing and advertising";
                                    break;
                                case "24":
                                    category = "Retail and customer services";
                                    break;
                                case "25":
                                    category = "Science, mathematics and statistics";
                                    break;
                                case "26":
                                    category = "Security, uniformed and protective services";
                                    break;
                                case "27":
                                    category = "Social sciences and religion";
                                    break;
                                case "28":
                                    category = "Social work and caring services";
                                    break;
                                case "29":
                                    category = "Sport and leisure";
                                    break;
                                case "30":
                                    category = "Transport, distribution and logistics";
                                    break;
                                default:
                                    category = "Administration, business and managemen";
                                    break;
                            }



                            var worker = new Worker({
                                name: messages[2],
                                category: category,
                                skills: messages[4],
                                brief: messages[5],
                                areas: messages[6],
                                no: no,
                                bids: 100,
                                date: new Date(),
                                id: milliSecondsSinceEpoch
                            });

                            if (messages[1] === "4") {
                                mongoWorker.updateWorkerProfile(worker, no).then((v) => {
                                    messageToSend += "Account successfully updated, now you can begin to get notifications of gigz that match your new account";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                        messageChain.delete(no);
                                    }).catch(console.error);


                                }).catch((e) => {
                                    console.error(e);
                                    messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                    messageChain.delete(no);
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);

                                });
                            } else {
                                mongoWorker.saveWorker(worker).then((v) => {
                                    messageToSend += "Account successfully saved, now you can begin to get notifications of gigz that match your skills and category, you get 100 FREE bids";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                        messageChain.delete(no);
                                    }).catch(console.error);


                                }).catch((e) => {
                                    console.error(e);
                                    messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                    messageChain.delete(no);
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);

                                });
                            }


                        } else {
                            messageToSend += "This is not what you want? You can Restart(type *#* to restart) ";
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);
                        }
                        break;
                    default:
                        // Error message
                        messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                        messageChain.delete(no);
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                        }).catch(console.error);
                        break;

                }


            }
        } else {

            if (query.toLowerCase() == "buy") {
                messageChain.delete(no);
                messages.push("First message");
                messageChain.set(no, messages);
                messageToSend += "Please enter your ecocash number, it works the same way as in a supermarket, you enter your number and you get a prompt to enter your PIN  e.g 0777123123,   \n\nYou can Restart(type *#* to restart) ";
                client.sendMessage(msg.from, messageToSend).then((res) => {
                    // console.log("Res " + JSON.stringify(res));
                }).catch(console.error);
            } else if (query.substring(query.indexOf('@') + 1, query.length).length === 13 && query.substring(0, query.indexOf('@')) === "bid") {
                mongoWorker.getWorker(no).then((v) => {
                    if (v != null) {
                        clientMap.set(no, v);
                        if (v.bids > 0) {

                            mongoGig.findGig(query.substring(query.indexOf('@') + 1, query.length)).then((v) => {

                                if (v != null) {
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    myGigsMap.set(no, v);
                                    let el = v;
                                    messageToSend += `This is the gig you want to bid for \n\nBudget:${el.budget}USD ${el.paymentStructure} \n${el.details}  \n${getDaysDifference(el.finalDay)} day(s) left to bid \n\n`;
                                    messageToSend += `Type your bid(application/proposal for the job) for the gig, this means basically, type your OFFER for the gig, it can include why they should work with you and not anyone else, your best price, ,type it *right after this message* \n\nIf this is not what you want type # to restart`;
                                } else {
                                    messageToSend += `The gig you typed has not been found, please check the link again or type # to restart`;
                                }


                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                }).catch(console.error);


                            }).catch((e) => {
                                console.error(e);
                                messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                                messageChain.delete(no);
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);

                            });

                        } else {
                            messageToSend += `It appears you are out of bids, you can buy more bids just 100RTGS Ecoash for 5 bids,to buy type Buy or click this link to https://wa.me/263713020524?text=Buy `;
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                            }).catch(console.error);
                        }

                    } else {
                        messageToSend += `It appears you do not have any account with us, to able to bid you need to have an account, to create an account, after this message, type hi, and select option 2 `;
                        messageChain.delete(no);
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                        }).catch(console.error);
                    }

                }).catch(console.error);

            } else if (query.substring(query.indexOf('@') + 1, query.length - 17) == "accept" && query.substring(0, query.indexOf('@')).length == 13) { // accept bid 
                messages.push(query);
                messageChain.set(no, messages);
                mongoGig.findGig(messages[0].substring(messages[0].indexOf('t') + 1, messages[0].indexOf('@gig'))).then((gig) => {
                    myGigsMap.set(no, gig);
                    if (gig.acceptingTimes > 0) {
                        var id = messages[0].substring(0, messages[0].indexOf('@'));
                        mongoWorker.getWorkerById(id).then((v) => {
                            messageToSend += `Congratulations your bid was accepted, you will can contact the person who posted the gig on ${gig.no.substring(0, no.indexOf('@'))}, remember to ask them to give you review, as that will improve your chances of getting more and more gigz and build your reputation, also make use of the affidavit as a way to deter scams`;
                            client.sendMessage(v[0].no, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                                //TODO remove one from acceptedTimes
                                var mess = `Thank you accepting this person's bid, you can contact the person who made the bid(proposal/application) on ${v[0].no.substring(0, no.indexOf('@'))} , remember to leave a review after the work is done, this helps the person build their reputation and helps them connect with other people who need the same work done, also make use of the affidavit as a way to deter scams \nTo Review click https://wa.me/263713020524?text=${v[0].id}@rate`;
                                client.sendMessage(no, mess).then((res) => {

                                }).catch(console.error);
                            }).catch(console.error);
                            var mediaMessage = "Take advantage of the affidavit sent to you, to sign agreement before the work starts";
                            const media = MessageMedia.fromFilePath('./gigzaffidavit.pdf');
                            client.sendMessage(v[0].no, media, { caption: mediaMessage }).catch(console.error);
                            client.sendMessage(no, media, { caption: mediaMessage }).catch(console.error);
                            messageChain.delete(no);
                            messages = [];
                            mongoGig.removeAcceptTimes(gig).catch(console.error);

                        }).catch((e) => {
                            console.error(e);
                            messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                            messageChain.delete(no);
                            messages = [];
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);

                        });
                    } else {
                        messageToSend += `We are glad we managed to connect you with talent for your gig, we charge a small 9% finders fee, to notify the talent you have chosen them, kindly type pay to pay finder\'s fee, \nTo pay, type the ecocash number you are using to pay, e.g 0713020524, \n(Payment works like in a supermarket, after putting the number you will get a prompt on your phone to put in your PIN)`;
                        client.sendMessage(no, messageToSend).then((res) => {
                        }).catch(console.error);
                    }

                }).catch((e) => {
                    console.error(e);
                    messageToSend += "Oooops looks like there was an error, initiating payment, please try again, by sending click the accept link ";
                    messageChain.delete(no);
                    client.sendMessage(msg.from, messageToSend).then((res) => {
                        // console.log("Res " + JSON.stringify(res));
                    }).catch(console.error);

                });


            } else if (query.substring(query.indexOf('@') + 1, query.length) == "profile" && query.substring(0, query.indexOf('@')).length == 13) { // see proposal bidder profile
                var id = query.substring(0, query.indexOf('@'));
                mongoWorker.getWorkerById(id).then((v) => {

                    if (v.length > 0) {
                        messageToSend += `Full Name: ${v[0].name} \nBrief:${v[0].brief} \nSkills: ${v[0].skills} \nAreas able to work: ${v[0].areas} \nTo see their work history click \nhttps://wa.me/263713020524?text=${v[0].id}@history \nTo see their reviews click \nhttps://wa.me/263713020524?text=${v[0].id}@reviews`;
                    } else {
                        messageToSend += `Profile not found`;
                    }

                    client.sendMessage(no, messageToSend).then((res) => {
                        // console.log("Res " + JSON.stringify(res));
                        messageChain.delete(no);
                    }).catch(console.error);

                }).catch((e) => {
                    console.error(e);
                    messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                    messageChain.delete(no);
                    client.sendMessage(msg.from, messageToSend).then((res) => {
                        // console.log("Res " + JSON.stringify(res));
                    }).catch(console.error);
                });
            } else if (query.substring(query.indexOf('@') + 1, query.length) == "reviews" && query.substring(0, query.indexOf('@')).length == 13) { // see proposal bidder reviews
                var id = query.substring(0, query.indexOf('@'));
                mongoWorker.getWorkerReviews(id).then((v) => {

                    if (v.length > 0) {
                        messageToSend += `These are the last reviews from the last few gigz this person worked on \n\n`
                        v.forEach((e) => {
                            messageToSend += `Budget ${e.budget} \n${e.details} \n${e.skills} \n\n`;
                        });
                        messageToSend += `________________END_______________________`;
                    } else {
                        messageToSend += `This person does not have reviews yet`;
                        messageChain.delete(no);
                    }

                    client.sendMessage(msg.from, messageToSend).then((res) => {

                    }).catch(console.error);


                }).catch((e) => {
                    console.error(e);
                    messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                    messageChain.delete(no);
                    client.sendMessage(msg.from, messageToSend).then((res) => {
                        // console.log("Res " + JSON.stringify(res));
                    }).catch(console.error);

                });
            } else if (query.substring(query.indexOf('@') + 1, query.length) == "history" && query.substring(0, query.indexOf('@')).length == 13) { // see worker history
                var id = query.substring(0, query.indexOf('@'));
                mongoGig.getWorkerHistory(id).then((v) => {

                    if (v.length > 0) {
                        messageToSend += `These are the last gigz this person worked on\n\n`;
                        v.forEach((e) => {
                            messageToSend += `Review \n${e.review} \n\n`;
                        });
                        messageToSend += `________________END__________________`;
                    } else {
                        messageToSend += `This person is yet to get a gig`;
                        messageChain.delete(no);
                    }

                    client.sendMessage(msg.from, messageToSend).then((res) => {

                    }).catch(console.error);


                }).catch((e) => {
                    console.error(e);
                    messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                    messageChain.delete(no);
                    client.sendMessage(msg.from, messageToSend).then((res) => {

                    }).catch(console.error);
                });
            } else if (query.substring(query.indexOf('@') + 1, query.length) == "rate" && query.substring(0, query.indexOf('@')).length == 13) { // see proposal bidder reviews
                messages.push(query);
                messageChain.set(no, messages);
                messageToSend += `Thank you for rating the service you got, can you please type briefly what was your experience working with this person`;
                client.sendMessage(msg.from, messageToSend).then((res) => {

                }).catch(console.error);
            } else if (query.toLowerCase() == "unsubscribe" || query.toLowerCase() == "unsubs" || query.toLowerCase() == "unsub") {
                mongoWorker.unsubscribe(no).then((res) => {
                    messageToSend += "It was an honor to serve you, all the best in the next part of your journey";
                    messageChain.delete(no);
                    messages = [];
                    client.sendMessage(msg.from, messageToSend).then((res) => {
                        // console.log("Res " + JSON.stringify(res));
                    }).catch((err) => {
                        console.log(e);
                        messageToSend += "Oooops looks like there was an error, please try again, by sending a new message ";
                        messageChain.delete(no);
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                        }).catch(console.error);
                    });

                }).catch(console.error);

            } else {

                messages.push("First message");
                messageChain.set(no, messages);
                var timeOfDay = "";
                if (new Date().getHours() < 12) {
                    timeOfDay = "Morning";
                } else if (new Date().getHours() > 12 && new Date().getHours() < 16) {
                    timeOfDay = "Afternoon";
                } else {
                    timeOfDay = "Day";
                }

                messageToSend = `Pleasant ${timeOfDay} ${name}, welcome  to Gigz  \n\nPlease type one of the options below e.g 1 \n\n\n0)What is Gigz? \n\n1) Type 1 to  POST a gig  \n\n2) Type 2 to register or  see gigz that match your skills  \n\n3) Type 3 to search for other gigz   \n\n4)Type 4 to update your account  \n\n5)Type 5 to see how this works \n\n6)Type 6 to send us feedback  \n\n7)Type 7 to see our terms and conditions as at 1.4.2022 \n\n8) See rental property \n\n\nBy using our platform you agreeing to terms and conditions as at 1.04.2022 \n#Believe `;

                client.sendMessage(msg.from, messageToSend).then((res) => {

                }).catch(console.error);


            }
        }


    }


});

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

function validateEmail(email) {
    email = email || "";
    let re = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
    return re.test(email.toLowerCase().trim());
}

function isValid(p) {
    var phoneRe = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
    var digits = p.replace(/\D/g, "");
    return phoneRe.test(digits);
}

function isValidDate(date) {
    return (new Date(date) !== "Invalid Date") && !isNaN(new Date(date));
}

function getDaysDifference(date) {
    var date1 = new Date();
    var date2 = new Date(date);

    // To calculate the time difference of two dates
    var Difference_In_Time = date2.getTime() - date1.getTime();

    // To calculate the no. of days between two dates
    return parseInt(Difference_In_Time / (1000 * 3600 * 24));

}

async function messagePeople(el) {
    console.log(el);
    try {
        var clients = await mongoWorker.getClientsBySkillsCat(el);
        if (clients != null && clients.length > 0) {
            var messageToSend = `New Gig Alert \n\n${el.details}  \nBudget:${el.budget} ${el.paymentStructure}  \n${getDaysDifference(el.finalDay)} day(s) left to bid \nTo Bid for this gig click this link https://wa.me/263713020524?text=bid@${el.id} `;
            clients.forEach(element => {
                client.sendMessage(element.no, messageToSend).catch(console.error);
            });

            twitter.post('statuses/update', { status: messageToSend }, function (error, tweet, response) {
                if (!error) {
                    console.log("Tweet sent");
                }
            })




        }
    } catch (e) {
        console.error(e);
    }


}

async function messageAccomodationPeople(house, contact) {
    try {
        var gigz = await mongoGig.getAccomodationGigz(house);
        if (gigz != null && gigz.length > 0) {
            gigz.forEach(element => {
                // Will add this soon
                // if (parseInt(element._doc.confidenceScore) > 50) {
                var messageToSend = `Update from gigz \n\n${house}\n${contact} \n\nThis is to help connect you with agents.Gigz is not affiliated with this agent but they might be able to you get the exact accomodation you want`;
                client.sendMessage(element.no, messageToSend).catch(console.error);
                // }

            });
        }
    } catch (e) {
        console.error(e);
    }

}

async function checkChats() {
    var chats = await client.getChats();
    chats.forEach((elem) => {
        if (elem.unreadCount > 0 && !elem.isGroup) {
            client.sendMessage(elem.id._serialized, "Introducting Gigz, connecting people building dreams, there was a network error, please restart by typing hie").catch(console.error);
        }
    });


}

client.on('status@broadcast', async status => {
    delete (status);
});



app.use(cors());


app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(express.json());


app.get('/api/v1/gigz/:skip', (req, res) => {
    mongoGig.getGigsToApproval(req.params.skip).then((v) => {

        res.json(v)

    }).catch(console.error);
});

app.post('/api/v1/approve', (req, res) => {

    messagePeople(req.body.gig);
    mongoGig.approve(req.body.gig).then((v) => {

        res.json(v);

    }).catch(console.error);
});

app.post('/api/v1/delete', (req, res) => {

    mongoGig.deleteGig(req.body.id).then((v) => {
        res.json(v);
    }).catch(console.error);
});


app.post('/api/v1/addedhouse', (req, res) => {
    messageAccomodationPeople(req.body.house, req.body.contact);
    var tweet = `${req.body.house.substring(0, 200)} Whatsapp 0713020524 for more leads`;
    twitter.post('statuses/update', { status: tweet }, function (error, tweet, response) {
        if (!error) {
            console.log("Tweet sent");
        }
    })
});

app.post('/api/v1/checkchats', (req, res) => {
    checkChats();
});

app.post('/api/v1/expire', (req, res) => {
    mongoGig.expire().then((v) => {
        res.json(v);
    }).catch(console.error);
});








app.listen(port, () => {
    console.log("Server Running Live on Port : " + port);
});

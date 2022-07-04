const express = require("express");
const fs = require('fs');
const shelljs = require('shelljs');
const qrcode = require('qrcode-terminal');
const { Client, MessageMedia } = require('whatsapp-web.js');
const cors = require('cors');
const system = require('system-commands');
const config = require('./config.json');
const paymentService = require("./services/paymentService");
const Payment = require("./models/paymentModel");
const initConnection = require('./config/config');
const { Paynow } = require("paynow");
const axios = require('axios');
const mongoWorker = require('./services/workerService.js');
const workerService = require("./services/workerService.js");
const { url } = require("inspector");
const reviewsModel = require("./models/reviewsModel");
const portfolioModel = require("./models/portfolioModel");
const QGenerator = require('./services/qGenerator');
const firebase = require("./services/firebase");
const Worker = require('./models/workerModel.js');
const Review = require('./models/reviewsModel.js');


initConnection();


process.title = "whatsapp-node-api";
global.client = new Client({ qrTimeoutMs: 0, puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--unhandled-rejections=strict'] } });
///
global.authed = false;
const app = express();







const port = process.env.PORT || config.port;
//Set Request Size Limit 50 MB

client.initialize();

client.on('qr', qr => {
    // console.log("initialize QR")
    qrcode.generate(qr, { small: true });
    fs.writeFileSync('./components/last.qr', qr);
});



client.on('authenticated', (session) => {
    console.log("AUTH HAS WORKED!");
    // sessionCfg = session;
    // fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function(err) {
    //     if (err) {
    //         console.error(err);
    //     }
    //     authed=true;
    // });
    // try{
    //     fs.unlinkSync('./components/last.qr')
    // }catch(err){}
});

client.on('auth_failure', () => {
    console.log("AUTH Failed !")
    sessionCfg = ""
    process.exit()
});





var sentMessages = 0;


client.on('ready', async () => {
    console.log('Gigz is running!');


});



client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});



var messageChain = new Map();
var invoice = new Date().getTime().toString();
const zwlPrice = 600;
var pollUrl = "";
var seenProfilesMap = new Map();
var clientMap = new Map();
var pdfMap = new Map();
var attachmentData = {};
const contactUs = "263719066282";
const gigzBot = "263713020524";

client.on('message', async msg => {


    // if (messageChain.has(no) && ) {
    // const media = MessageMedia.fromFilePath(`./Quotation 1234.pdf`);
    // client.sendMessage(msg.from, media, { caption: "Test Document" }).catch(console.error);
    // }




    // Check for media
    if (msg.hasMedia) {

        attachmentData = await msg.downloadMedia();
        // for (let index = 0; index < 10; index++) {
        //     // const media = MessageMedia.fromFilePath(`./Quotation 1234.pdf`);
        //     client.sendMessage(msg.from, attachmentData, { caption: "Test Document" }).catch(console.error);
        // }
    }










    /// A unique identifier for the given session
    // const sessionId = randomString({ length: 20 });
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


    if (msg.from.length < 23 && msg.from.includes("@c")) {


        if (query.substring(query.indexOf("@"), query.length).toLowerCase() === "@va" && query.includes("@va") && query.substring(0, query.indexOf("@va")) !== "add") { // Virtual Assistant channel
            messageChain.delete(no);
            let businessName = query.substring(0, query.indexOf("@va"))
            mongoWorker.checkName(businessName).then((r) => {
                var timeOfDay = "";
                if (new Date().getHours() < 12) {
                    timeOfDay = "Morning";
                } else if (new Date().getHours() > 12 && new Date().getHours() < 16) {
                    timeOfDay = "Afternoon";
                } else {
                    timeOfDay = "Day";
                }
                if (r === null) {
                    messageToSend = `Pleasant ${timeOfDay} ${name}, it appears that Virtual Assistant is no longer operational, kindly contact the person who gave you the link to find out if it is still operational`;

                } else {
                    clientMap.set(no, r);
                    messages.push(query);
                    messageChain.set(no, messages);
                    messageToSend = `Pleasant ${timeOfDay} ${name}, welcome to ${businessName}'s Virtual Assistant \n\n \n*1* About ${businessName} \n*2* See services \n*3* Frequently asked questons   \n\nSend the number of the option you want, e.g send 2 if you want to see ${businessName}'s services`;
                }
                client.sendMessage(msg.from, messageToSend).then((res) => {

                }).catch(console.error);
            }).catch(console.error);


        } else if (query === "#") { // Restart coversation
            messageToSend = "You have restarted.\nType hi message to continue or click link below \nhttps://wa.me/263713020524?text=hie";
            messageChain.delete(no);

            client.sendMessage(msg.from, messageToSend).then((res) => {
                // console.log("Res " + JSON.stringify(res));
            }).catch((e) => {
                console.error(e);
                messageToSend = "Oooops looks like there was an error, please try again, by sending a new message ";

                client.sendMessage(msg.from, messageToSend).then((res) => {
                    // console.log("Res " + JSON.stringify(res));
                }).catch((console.error));
            });
        } else if (query.substring(query.indexOf('@') + 1, query.length) === "profile" && query.substring(0, query.indexOf('@')).length === 13) { // See Profile
            // See profile
            messageChain.delete(no);
            var id = query.substring(0, query.indexOf('@'));
            mongoWorker.getWorkerById(id).then((v) => {
                let website = "";
                if (v.package === "7.99") {
                    website = `${v.name}.gigz.co.zw`;
                }
                messageToSend = `Name: ${v.name} \nBrief Intro:${v.brief} \nServices: ${v.skills} \nAreas able to serve: ${v.areas} \nTo chat to their Chatbot(Virtual Assistant) click \nhttps://wa.me/263713020524?text=${v.name}@va   ${website} \n_Contact_: https://wa.me/${v.no.substring(0, v.no.indexOf("@c.us"))}?text=Hi+I+got+your+number+from+Gigz+I+am+interested+in+your+services`;
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
        } else if (query.toLowerCase() === "subscribe") { // subscribe to service
            messageChain.delete(no); //Ensure all previous messages are deleted
            messages.push(query);
            messageChain.set(no, messages);
            messageToSend = "Please select the package you would like to subscribe to \n\n \n*1* Silver package for 5.99USD p.m only (Profile and Virtual Assistant) \n*2* Gold Package 7.99USD p.m (Profile , Virtual Assistant and Web page)  \n*3* Platinum Package (Custom solution to improve your services)  \n\nTo choose any option send a number eng. 2 to get pay for a Profile, Virtual Assistant and a Web page \n\nTerms and Conditions Apply, to see them send Terms or click this link https://wa.me/263713020524?text=terms";

            client.sendMessage(msg.from, messageToSend).then((res) => {
                // console.log("Res " + JSON.stringify(res));
            }).catch((console.error));
        } else if (query.toLowerCase() === "terms") { // See Terms
            messageChain.delete(no);
            var mediaMessage = "Gigz Terms and Conditions";
            const media = MessageMedia.fromFilePath('./t&cs.pdf');
            messageChain.delete(no);
            client.sendMessage(no, media, { caption: mediaMessage }).catch(console.error);
            client.sendMessage(msg.from, mediaMessage).then((res) => {
                // console.log("Res " + JSON.stringify(res));
            }).catch((console.error));
        } else if (query.substring(query.indexOf('@') + 1, query.length) === "portfolio" && query.includes("@portfolio")) { // See portfolio
            messageChain.delete(no);
            let businessName = query.substring(0, query.indexOf('@'));
            mongoWorker.checkName(businessName).then((v) => {
                if (v === null) {
                    messageChain.delete(no);
                    messageToSend = "It appears this user is yet to create an account, only registered people can add their portfolio pictures";
                } else {
                    messages.push(query);
                    messageChain.set(no, messages);
                    messageToSend = "You want to add to your portfolio which showcases the work you have done, great, we take one picture per description, we advise you to post *only the best pictures*";
                }
                client.sendMessage(msg.from, messageToSend).then((res) => {
                    // console.log("Res " + JSON.stringify(res));
                }).catch((console.error));
            }).catch(console.error);
        } else if (query.substring(query.indexOf('@') + 1, query.length) === "pic" && query.substring(0, query.indexOf('@')).length === 13) {
            messageChain.delete(no);
            let id = query.substring(0, query.indexOf('@'));
            mongoWorker.getWorkerById(id).then((v) => {
                if (v === null) {
                    messageChain.delete(no);
                    messageToSend = "It appears this user is yet to create an account, only registered people can add their profile pictures";
                } else {
                    messages.push(query);
                    messageChain.set(no, messages);
                    clientMap.set(no, v);
                    messageToSend = "You want to add your picture, great, send your picture now";
                }
                client.sendMessage(msg.from, messageToSend).then((res) => {
                    // console.log("Res " + JSON.stringify(res));
                }).catch((console.error));
            }).catch(console.error);

        } else if (query.substring(query.indexOf('@') + 1, query.length) === "rate" && query.includes("@rate")) { // rate or put recommendations
            messageChain.delete(no);
            let username = query.substring(0, query.indexOf('@'));
            mongoWorker.checkName(username.toLowerCase()).then((v) => {

                if (v === null) {
                    messageToSend += `We do not appear to have this user in our database, please ask them again, and try again`;
                } else {
                    messages.push(query.toLowerCase());
                    messageChain.set(no, messages);
                    messageToSend += `Thank you for rating the service you got, on a scale of 1 to 5, how would you rate the service you got, you can only type a number between 1 and 5`;
                }
                client.sendMessage(msg.from, messageToSend).then((res) => {

                }).catch(console.error);

            }).catch(console.error);
        } else if (query.toLowerCase() === "addva") {
            messageChain.delete(no);
            mongoWorker.getWorker(no).then((v) => {
                if (v === null) {
                    messageToSend = `It appears you are yet to create an account, create an account today, by selecting option 2, on the welcome message, send any message now to get to the main page`;
                    messageChain.delete(no);
                } else {
                    clientMap.set(no, v);
                    messages.push(query.toLowerCase());
                    messageChain.set(no, messages);
                    messageToSend = `Add your Chatbot(Virtual Assistant) \nPlease list all your services and the price for each separated by a comma in this format descr=amount and send them, all the you services listed above \ne.g website deveopmen=100USD, Mobile Application development=300USD \nOR \nMoving goods local(in town)=10USD,Moving goods above 2T=45USD \nOR \nPedicure=7USD,Manicure=10USD \n\nIf you need to Edit your Chatbot (Virtual Assistant) click this link https://wa.me/${gigzBot}?text=addva`;
                }
                client.sendMessage(msg.from, messageToSend).then((res) => {

                }).catch(console.error);
            }).catch(console.error);

        } else {

            if (messageChain.has(no)) { // check if user is already in communication
                messages = messageChain.get(no);
                switch (messages.length) { // looking to get the context of the current conversation
                    case 1:
                        if (messages.length > 2) {
                            messageToSend = "Our apology there was a network error, kindly try again, type # to restart";
                            messageChain.delete(no);
                            client.sendMessage(msg.from, messageToSend).then((res) => {

                            }).catch(console.error);
                        } else {
                            if (messages[0] === "subscribe") { // Subscribe 

                                if (query === "3") { // Custom software package
                                    messageToSend = "Please send click this link https://wa.me/263719066282?text=Hi+Gigz+I+want+a+custom+software+solution+for+my+business";

                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        messageChain.delete(no);
                                    }).catch((console.error));


                                } else { // One of the two packages
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    messageToSend = "Please send the Ecocash number you are using to pay, e.g 0771123123 our system works just like the system in the supermarket, after you put in your phone number it will send you a prompt to pay on your phone";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch((console.error));
                                }
                            } else if (messages[0].substring(messages[0].indexOf("@"), messages[0].length).toLowerCase() === "@va" && messages[0].includes("@va")) {

                                let v = clientMap.get(no);
                                if (query === "1") { // About
                                    let website = "";
                                    if (v.package === "7.99") {
                                        website = `${v.name}.gigz.co.zw`;
                                    }
                                    messageToSend = `Name: ${v.name} \nBrief Intro:${v.brief} \nServices: ${v.skills} \nAreas able to serve: ${v.areas} \nTo chat to their virtual assistant click \nhttps://wa.me/263713020524?text=${v.name}@va   ${website} \n_Contact_: https://wa.me/${v.no.substring(0, v.no.indexOf("@c.us"))}?text=Hi+I+got+your+number+from+Gigz+I+am+interested+in+your+services`;
                                    messageChain.delete(no);
                                } else if (query === "2") { // Services 
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    let servicesPrices = v.prices.split(",");
                                    messageToSend = `${name}'s Services and costs \n\n`;
                                    for (let index = 0; index < servicesPrices.length; index++) {
                                        const element = servicesPrices[index];
                                        messageToSend += `${index + 1} ${element.substring(0, element.indexOf("="))}  ${element.substring(element.indexOf("=") + 1, element.length)}\n\n`;
                                    }
                                    messageToSend += `____________END___________\n`;
                                    messageToSend += `Select one of the options below  \n*1* Create a quotation \n*2* See work done before  \n*3* To see reviews \n_Contact_: https://wa.me/${v.no.substring(0, v.no.indexOf("@c.us"))}?text=Hi+I+got+your+number+from+Gigz+I+am+interested+in+your+services`;
                                } else if (query === "3") { // FAQs
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    let servicesFAQS = v.faqs.split(",");
                                    messageToSend = `Frequently Asked Questions \n\n`;
                                    for (let index = 0; index < servicesFAQS.length; index++) {
                                        const element = servicesFAQS[index];
                                        messageToSend += `*${index + 1}* ${element.substring(0, element.indexOf("="))}\n\n`;
                                    }
                                    messageToSend += `____________END___________\n`;
                                    messageToSend += `Send the question you are looking an answer for by the sending the number on the left of it e.g 1 \n_Contact_: https://wa.me/${v.no.substring(0, v.no.indexOf("@c.us"))}?text=Hi+I+got+your+number+from+Gigz+I+am+interested+in+your+services`;
                                } else {
                                    messageToSend = "This response is out of the expected one, please select one of the options 1 or 2 or 3 , if this is not what you type # to restart";
                                }
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((console.error));
                            } else if (messages[0].substring(messages[0].indexOf('@') + 1, messages[0].length) === "rate" && messages[0].includes("@rate")) {
                                if (parseInt(query) + 1 < 6 && parseInt(query) + 1 > 1) {
                                    messageToSend = "It appears you have put in a number that is not between 1 and 5, please only enter a number between those numbers";
                                } else {
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    messageToSend = "Thank you sending in your rating, can you type briefly about your experience with this service";
                                }
                                client.sendMessage(msg.from, messageToSend).then((res) => {

                                }).catch(console.error);
                            } else if (messages[0].substring(messages[0].indexOf('@') + 1, messages[0].length) === "pic" && messages[0].substring(0, messages[0].indexOf('@')).length === 13) {
                                let businessName = clientMap.get(no).name;
                                if (msg.hasMedia) {
                                    return firebase.addImage(businessName, attachmentData.data, "pic").then((r) => {

                                        if (r === null) {
                                            messageToSend = `There was an error adding your display picture please try again, if the problem persists try again later, https://wa.me/${gigzBot}?text=${businessName}@pic`;
                                            messageChain.delete(no);
                                            client.sendMessage(msg.from, messageToSend).then((res) => {

                                            }).catch(console.error);
                                        } else {
                                            return mongoWorker.addPicture(no, r).then((r) => {
                                                //TODO check is was added successfully
                                                messageToSend = `Your display picture was added successfully, if you want to change it, you can do so by clicking https://wa.me/${gigzBot}?text=${businessName}@pic`;
                                                messageChain.delete(no);
                                                client.sendMessage(msg.from, messageToSend).then((res) => {

                                                }).catch(console.error);
                                            }).catch(console.error);
                                        }


                                    }).catch(console.error);
                                } else {
                                    messageToSend = `It appears the picture was not downloaded properly please send the picture again`;
                                    messageChain.delete(no);
                                    client.sendMessage(msg.from, messageToSend).then((res) => {

                                    }).catch(console.error)
                                }





                            } else if (messages[0].substring(messages[0].indexOf('@') + 1, messages[0].length) === "portfolio" && messages[0].includes("@portfolio")) {
                                messages.push(attachmentData.data);
                                messageChain.set(no, messages);
                                if (msg.hasMedia) {
                                    messageToSend = "Thank you for sending your picture, please type a very brief description about the picture, here you could include what is in the picture, and/or the prices and/or the quality of work done, and how long it took you to have it done";
                                } else {
                                    messageToSend = "It appears you did not send a picture or your picture was not download, please send again, the best of what you have, because this helps you get clients, if this is not what you want to do you can type # to restart";
                                }
                                client.sendMessage(msg.from, messageToSend).then((res) => {

                                }).catch(console.error);
                            } else if (query === "1" && messages[0] === "1073unashe") {
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend = `Please send the service you are looking for *OR* the service providers occupation e.g  carpenter OR I need someone to help me find accommodation  \n\nTerms and Conditions Apply to see them send term or click this link https://wa.me/${gigzBot}?text=terms`;

                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((console.error));
                            } else if (query === "2" && messages[0] === "1073unashe") {

                                checkPayment(no).then((v) => {
                                    if (v.expired) {
                                        messageToSend = "It appears you are yet to subscribe, please type subscribe or click this link https://wa.me/263713020524?text=subscribe";
                                    } else {
                                        var clientArr = [v.package];
                                        clientMap.set(no, clientArr);
                                        messages.push(query);
                                        messageChain.set(no, messages);
                                        messageToSend += `Please answer the next few questions, you will only be asked once, they help to market your services, so be honest and take them seriously \nPlease tell us your full name or the name of your business (this has to be unique, if it was already taken you will be asked again), \n\nIf this is not what you want type # to restart`;
                                    }
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch((console.error));
                                })

                            } else if (query === "3" && messages[0] === "1073unashe") { // How does this work option?
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend = "Please select the option you would like \n\n \n*1* What is Gigz? \n*2* Frequently Asked Questions \n*3* Terms and Conditions  \n\nTo choose any option send a number eng. 2 to get pay for a Profile, Virtual Assistant and a Web page ";

                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((console.error));
                            } else if (messages[0] === "addva") { // List of services
                                let servicesArray = query.split(",");
                                if (servicesArray.length < 1 || servicesArray === null) {
                                    messageToSend = "It appears you did not list your services the right way, please follow these instructions , we need just two more answers for your Virtual Assistant, please list all your services and the price for each separated by a comma in this format descr=amount and send them, all the you services listed above e.g website deveopmen=100USD, Mobile Application development=300USD \nOR \nMoving goods local(in town)=10USD,Moving goods above 2T=45USD \nOR \nPedicure=7USD,Manicure=10USD";

                                } else {
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    messageToSend = `These are your services and prices, your Chatbot(Virtual Assistant) will use this to send quotations to people \n\n`;
                                    for (let index = 0; index < servicesArray.length; index++) {
                                        const element = servicesArray[index];
                                        messageToSend += `${index + 1} ${element.substring(0, element.indexOf("="))}  ${element.substring(element.indexOf("=") + 1, element.length)}\n\n`;
                                    }
                                    messageToSend += `Please confirm these are your services and the prices are correct \n*1* Yes, it is correct \n*2* Not correct, can I retype them  \n\nSend the number that shows the option you want e.g 1 to confirm these are correct `;
                                }
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((console.error));
                            } else {
                                messageToSend = "This response is out of the expected ones, this chat has been restarted, send hi to choose the option you want";
                                messageChain.delete(no);
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((console.error));
                            }
                        }


                        break;
                    case 2:
                        if (messages.length > 3) {
                            messageToSend = "Our apology there was a network error, kindly try again";
                            messageChain.delete(no);
                            client.sendMessage(msg.from, messageToSend).then((res) => {

                            }).catch(console.error);

                        } else {
                            if (messages[0] === "subscribe") { // Subscribe initiate payment

                                if (isValidPhoneNumber(query)) {
                                    //Initiating paynow

                                    const paynow = new Paynow("4114", "857211e6-052f-4a8a-bb42-5e0d0d9e38e7");
                                    let payment = paynow.createPayment(invoice, "anelesiwawa@gmail.com");

                                    let package = 0;
                                    if (messages[1] = 1) {
                                        package = 5.99;
                                    } else {
                                        package = 7.99;
                                    }
                                    let amount = 1;//zwlPrice * package;
                                    payment.add("Subscription", amount);
                                    paynow.sendMobile(

                                        // The payment to send to Paynow
                                        payment,

                                        // The phone number making payment 
                                        query.toString(),

                                        // The mobile money method to use. 
                                        'ecocash'

                                    ).then((v) => {

                                        if (v.success) {
                                            messages.push(query);
                                            messageChain.set(no, messages);
                                            pollUrl = v.pollUrl;
                                            messageToSend += "After you set your PIN, type paid so we can confirm your payment or click https://wa.me/263713020524?text=paid   \n\nYou can Restart(type *#* to restart) ";

                                        } else {
                                            messageToSend += "It appears there was an error, please type your number again, to retry   \n\nYou can Restart(type *#* to restart) ";
                                        }
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
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

                                } else {
                                    messageToSend = "It appears you did not enter a valid phone number, please check the number and send again";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch((console.error));
                                }
                            } else if (messages[0].substring(messages[0].indexOf('@') + 1, messages[0].length) === "rate" && messages[0].includes("@rate")) {

                                let businessName = messages[0].substring(0, messages[0].indexOf('@'));
                                let newReview = new reviewsModel({
                                    review: query,
                                    name: businessName,
                                    stars: parseInt(messages[1]),
                                    reviewer_no: no,
                                });

                                mongoWorker.addReview(newReview).then((r) => {

                                    if (r === null) {
                                        messageToSend = "It seems you already rated this service provider, we only allow you to rate a service provider once";
                                    } else {
                                        messageToSend = "Thank you for leaving a review of the service you got, this will help someone else when they are interested in working with this person";
                                    }
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);

                                }).catch(console.error);
                            } else if (messages[0].substring(messages[0].indexOf('@') + 1, messages[0].length) === "portfolio" && messages[0].includes("@portfolio")) {
                                //TODO Add file to firebase
                                let businessName = messages[0].substring(0, messages[0].indexOf('@'));

                                return firebase.addImage(businessName, messages[1], invoice.toString()).then((imageUrl) => {

                                    if (imageUrl === null) {
                                        messageToSend = `There was an error adding your portfolio picture please try again, if the problem persists try again later, https://wa.me/${gigzBot}?text=${businessName}@pic`;
                                        messageChain.delete(no);
                                        client.sendMessage(msg.from, messageToSend).then((res) => {

                                        }).catch(console.error);
                                    } else {
                                        let portfolio = new portfolioModel({
                                            name: businessName,
                                            no: no,
                                            imageUrl: imageUrl,
                                            description: query,
                                            date: new Date(),
                                        })
                                        return mongoWorker.addPortfolio(portfolio).then((r) => {
                                            //TODO check is was added successfully
                                            messageToSend = `Your image was added to your portfolio successfully, you can add more, we encourage you to do so, by clicking https://wa.me/${gigzBot}?text=${businessName}@portfolio`;
                                            messageChain.delete(no);
                                            client.sendMessage(msg.from, messageToSend).then((res) => {

                                            }).catch(console.error);
                                        }).catch(console.error);
                                    }


                                }).catch(console.error);


                            } else if (messages[0].substring(messages[0].indexOf("@"), messages[0].length).toLowerCase() === "@va" && messages[0].includes("@va")) {
                                let v = clientMap.get(no); // get the business's profile saved in the map
                                if (messages[1] === "2") { // Confirm this is option for services
                                    if (query === "1") { // Confirm items for Quotation
                                        messages.push(query);
                                        messageChain.set(no, messages);
                                        let servicesPrices = v.prices.split(",");
                                        messageToSend = `Here are ${name}'s Services and costs again for you to choose \n\n`;
                                        for (let index = 0; index < servicesPrices.length; index++) {
                                            const element = servicesPrices[index];
                                            messageToSend += `${index + 1} ${element.substring(0, element.indexOf("="))}  ${element.substring(element.indexOf("=") + 1, element.length)}\n\n`;
                                        }
                                        messageToSend += `____________END___________\n`;
                                        messageToSend += `Type the number of each of the services you want separated by a comma(for any service you need more than once you can just type it as many times as you need it)  and send e.g 1,2,2,3  for services 1 and 2(this service is required twice) and 3 \nOR \n1,1,1,2,3 for services 1(this service is required thrice) and 4 and 6 `;
                                        client.sendMessage(msg.from, messageToSend).then((res) => {

                                        }).catch(console.error);
                                    } else if (query === "2") { // Portfolio
                                        return mongoWorker.getPortfolio(v.name).then((r) => {
                                            r.forEach(element => {
                                                let options = {
                                                    unsafeMime: true,
                                                }
                                                return MessageMedia.fromUrl(element.imageUrl, options).then((media) => {
                                                    client.sendMessage(msg.from, media, { caption: element.description }).catch(console.error);
                                                }).catch(console.error);

                                            });

                                        }).catch(console.error);

                                    } else if (query === "3") { // See reviews

                                        mongoWorker.getWorkerReviews(v.name).then((r) => {

                                            if (r.length > 0) {
                                                messageToSend += `These are last 7 reviews ${v.name} has had\n\n`;
                                                r.forEach((e) => {
                                                    messageToSend += `_Rating_:${e.stars}\n${e.review} \n\n`;
                                                });
                                                messageToSend += `________________END___________________\n`;
                                            } else {
                                                messageToSend += `${v.name} does not have any reviews yet`;
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
                                    } else { // outside of the options

                                        messageToSend = `It appears you did not select one of the available options, please select option 1 or 2 or 3`;
                                        client.sendMessage(msg.from, messageToSend).then((res) => {

                                        }).catch(console.error);
                                    }
                                } else if (messages[1] === "3") { // FAQs answers
                                    let answers = v.faqs.split(",");
                                    messageToSend = `Answer \n${answers[parseInt(query) - 1].substring(answers[parseInt(query) - 1].indexOf("=") + 1, answers[parseInt(query) - 1].length)}  \n\nYou can select another number to get an answer to another question, or type # to restart`;
                                    client.sendMessage(msg.from, messageToSend).then((res) => {

                                    }).catch(console.error);
                                } else { // Selected option outside of those provided

                                    messageToSend = `It appears you did not select one of the available options, please select option 1 or 2 or 3`;
                                    client.sendMessage(msg.from, messageToSend).then((res) => {

                                    }).catch(console.error);
                                }

                            } else if (messages[1] === "1" && messages[0] === "1073unashe") { // Search

                                var seenProfiles = [];
                                mongoWorker.getWorkers(query, 0).then((r) => {

                                    if (r.length > 0) {
                                        messageToSend += "Available service providers right now\n\n";
                                        r.forEach((el) => {
                                            messageToSend += `_Name_: *${el.name}* \n_Services_: ${el.skills} \n_See Profile_:  https://wa.me/263713020524?text=${el.id}@profile \n_Chatbot(Virtual Assistant)_:https://wa.me/${gigzBot}?text=${el.name}@va \n_Contact_: https://wa.me/${el.no.substring(0, el.no.indexOf("@c.us"))}?text=Hi+I+got+your+number+from+Gigz+I+am+interested+in+your+services \n\n`;
                                            seenProfiles.push(el);
                                        });
                                        seenProfilesMap.set(no, seenProfiles);
                                        messageToSend += "_________________END_________________\n";
                                        messageToSend += `Please select one of the option below \n1)To see the next service providers \n\nType # to restart`;
                                    } else {
                                        messageToSend += `It appears there are no service providers that match your search at the moment, please try again tomorrow, or try searching using another term we have over 100 service providers already registered, \n\nYou can retry your search here`;
                                        messageChain.delete(no);
                                    }

                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);

                                }).catch(console.error);

                            } else if (messages[1] === "2" && messages[0] === "1073unashe") { // Check name and send categories
                                mongoWorker.checkName(query.toLowerCase()).then((v) => {

                                    if (v === null) {
                                        messages.push(query);
                                        messageChain.set(no, messages);
                                        messageToSend += `Please select the category of your services by typing the number of the category e.g 3,or clicking the link below it \n\n1)Administration, business and management\nhttps://wa.me/263713020524?text=1 \n\n2)Animals, land and environment\nhttps://wa.me/263713020524?text=2 \n\n3)Architecture\nhttps://wa.me/263713020524?text=3 \n\n4)Computing and ICT\nhttps://wa.me/263713020524?text=4 \n\n5)Construction and building\nhttps://wa.me/263713020524?text=5 \n\n6)Design, arts and crafts\nhttps://wa.me/263713020524?text=6 \n\n7)Education and training\nhttps://wa.me/263713020524?text=7 \n\n8)Energy production services\nhttps://wa.me/263713020524?text=8 \n\n9)Engineering\nhttps://wa.me/263713020524?text=9  \n\n10)Facilities and property services\nhttps://wa.me/263713020524?text=10 \n\n11)Farming, Fishing, and Forestry\nttps://wa.me/263713020524?text=11 \n\n12)Financial services\nhttps://wa.me/263713020524?text=12 \n\n13)Garage services\nhttps://wa.me/263713020524?text=13  \n\n14)Hairdressing and beauty https://wa.me/263713020524?text=14 \n\n15)Healthcare\nhttps://wa.me/263713020524?text=15  \n\n16)Heritage, culture and libraries\nhttps://wa.me/263713020524?text=16  \n\n17)Hospitality, catering and tourism \nhttps://wa.me/263713020524?text=17 \n\n18)Languages \nhttps://wa.me/263713020524?text=18 \n\n19)Legal and court services\nhttps://wa.me/263713020524?text=19 \n\n20)Manufacturing and production\nhttps://wa.me/263713020524?text=20 \n\n21)Mining and extraction services\nhttps://wa.me/263713020524?text=21  \n\n22)Performing arts and media \nhttps://wa.me/263713020524?text=22   \n\n23)Print and publishing, marketing and advertising \nhttps://wa.me/263713020524?text=23  \n\n24)Retail and customer services\nhttps://wa.me/263713020524?text=24  \n\n25)Science, mathematics and statistics \nhttps://wa.me/263713020524?text=25 \n\n26)Security, uniformed and protective services \nhttps://wa.me/263713020524?text=26 \n\n27)Social sciences and religion\nhttps://wa.me/263713020524?text=27 \n\n28)Social work and caring services\nhttps://wa.me/263713020524?text=28 \n\n29)Sport and leisure \nhttps://wa.me/263713020524?text=29 \n\n30)Transport, distribution and logistics\nhttps://wa.me/263713020524?text=30  \n\n#) Restart(type # to restart)`;
                                    } else {
                                        messageToSend = "This name is already taken please try another name or structure it differently"
                                    }
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch((console.error));

                                }).catch(console.error);
                            } else if (messages[1] === "3" && messages[0] === "1073unashe") { // How does it work?
                                if (query === "1") { // What is gigz?
                                    messageToSend = "Gigz is a platform  \n\n*For service providers* \nIt helps them market their services and gives them tools to improve their services, \n\n*For people searching for a service* \nIt helps people who are searching for services get them conviniently, excellently and reliably, to use Gigz you can either use our Whatsapp system on this number, or our website on www.gigz.co.zw";
                                } else if (query === "2") { // FAQs
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    messageToSend = "Please send the number of the option you want \n\n*1* I am looking for a service what do I do? \n*2* How do I register as a service provider? \n*3* What is a Virtual Assistant?  \n*4* What is a Web Page?   \n\nFor any other questions you can contact our support number by clicking this link https://wa.me/263719066282?text=Hi+Gigz+I+have+a+question";
                                } else if (query === "3") { // Terms and conditions
                                    messageToSend = "Sending Terms and Conditions Pdf document";
                                    var mediaMessage = "Gigz Terms and Conditions";
                                    const media = MessageMedia.fromFilePath('./t&cs.pdf');
                                    messageChain.delete(no);
                                    client.sendMessage(no, media, { caption: mediaMessage }).catch(console.error);
                                } else { // Option outside available ones
                                    messageToSend = "You were looking at FAQs, but sent something outside the options, so the chat has restarted, you can type hi now";
                                    messageChain.delete(no);
                                }
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((console.error));

                            } else if (messages[0] === "addva") { // Ask for FAQs
                                if (query === "1") {
                                    messages.push(query);
                                    messageChain.set(no, messages);
                                    messageToSend = "One last question, your clients, might have questions, please help them get answers quickly, by sending frequently asked questions in the format question=answer separate each by a comma \n\nExamples \nDo you do house calls?=yes,how much is pedicure if I have my own nails?=To ensure quality we use only our nails which we know the source and works well together the rest of our tools \nOR \nHow secure is your website?=It is very secure and even protected from bots,How long does it take to make a mobile application on average?=It takes 3 weeks for a basic application more complex apps might take longer but never more than 3 months \nOR\nHow big is your truck to move my goods?=We can take every load size 2T, 5T, 10T to carry every load,I have few items that I want to carry local, does that change the price?=No our local prices are fixed";
                                } else if (query === "2") {
                                    messageToSend = `Okay let us do this again,we need just two more answers for your Virtual Assistant, please list all your services and the price for each separated by a comma in this format descr=amount and send them, all the you services listed above e.g website deveopmen=100USD, Mobile Application development=300USD \nOR \nMoving goods local(in town)=10USD,Moving goods above 2T=45USD \nOR \nPedicure=7USD,Manicure=10USD   \n\nClick this link to restart https://wa.me/${gigzBot}?text=addva`;
                                    messageChain.delete(no);
                                } else {
                                    messageToSend = "This response is out of the expected one, Please send one of the options indicated above 1 or 2 or 3 or 4";
                                }
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((console.error));
                            } else {
                                messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                                messageChain.delete(no);
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);
                            }
                        }


                        break;
                    case 3:
                        if (messages[1] === "1" && messages[0] === "1073unashe") { // Search for services 2 round of results
                            if (query === "1") {
                                var seenProfiles = seenProfilesMap.get(no).length;
                                mongoWorker.getWorkers(query, seenProfiles).then((r) => {

                                    if (r.length > 0) {
                                        messageToSend += "Available service providers right now\n\n";
                                        r.forEach((el) => {
                                            messageToSend += `Name: *${el.name}* \nServices: *${el.skills}* \n_See Profile_:  https://wa.me/263713020524?text=${el.id}@profile \n_Contact_: https://wa.me/${el.no.substring(0, el.no.indexOf("@c.us"))}?text=Hi+I+got+your+number+from+Gigz+I+am+interested+in+your+services \n\n`;
                                            seenProfiles.push(el);
                                        });
                                        seenProfilesMap.set(no, seenProfiles);
                                        messageToSend += "_________________END_________________\n";
                                        messageToSend += `Please select one of the option below \n1)To see the next services providers \n\nType # to restart `;
                                    } else {
                                        messageToSend += `It appears there are no service providers that match your search at the moment, please try again tomorrow, or try searching using another term we have over 100 service providers already registered, \n\nYou can retry your search here`;
                                        messageChain.delete(no);
                                    }

                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                    }).catch(console.error);

                                }).catch(console.error);
                            } else {
                                messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                                messageChain.delete(no);
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);
                            }

                        } else if (messages[1] === "2" && messages[0] === "1073unashe") { // Register add services
                            messages.push(query);
                            messageChain.set(no, messages);
                            messageToSend += "Please type your services, separate each service by a comma,  e.g cooking, dancing, web development,decor, grooming and etiquitte, \n\nIf this is not what you want type # to restart ";
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);

                        } else if (messages[1] === "3" && messages[0] === "1073unashe") { // How does this work
                            if (messages[2] === "2") { // FAQs
                                if (query === "1") {
                                    messageToSend = "There are several ways to search for a service, you can go on our simple website gigz.co.zw and enter the service or service provider you are looking for and click enter, results will pop up \n*OR* \nYou can service on this whatsapp system, to search from this point type # to restart, then type hi, and after the welcome message, then send 1 and after the question type the service or service provider you are looking for, \n\nIT IS FREE TO USE";
                                } else if (query === "2") {
                                    messageToSend = "To register you need to subscribe:to subscribe send subscribe or click this link https://wa.me/263713020524?text=subscribe, after you subscribe, on the welcome screen send 2, to register and answer the questions that follow, please ensure you follow the formats mentioned for best results";
                                } else if (query === "3") {
                                    messageToSend = "A virtual assistant is a Whatsapp with automated(Computer generated) responses sometimes refered to as Whatsapp Bot, Gigz is an example of such, when you create a profile you get to create one for your services, so clients can see your prices, see Frequently asked questions, and even get a quotation in pdf format, with a virtual assistant you can concentrate on your work, while it works for you";
                                } else if (query === "4") {
                                    messageToSend = "Gigz web page is a online site for your services, it would be found on [yourname].gigz.co.zw , and is really a website without the extra costs of a domain and hosting, and new ways of showing your website will be added weekly, ";
                                } else {
                                    messageToSend = "This response is out of the expected one, Please send one of the options indicated above 1 or 2 or 3 or 4";

                                }

                            } else {
                                messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                                messageChain.delete(no);
                            }
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch((console.error));

                        } else if (messages[0] === "subscribe") { // Subscribe Confirm payment
                            if (query.toLowerCase() === "paid") {
                                let status = await axios.get(pollUrl);
                                if (status.data.includes("status=Paid") || status.data.includes("status=Awaiting Delivery") || status.data.includes("status=Delivered")) {

                                    let package = 0;
                                    if (messages[1] = 1) {
                                        package = 5.99;
                                    } else {
                                        package = 7.99;
                                    }
                                    let amount = zwlPrice * package;

                                    let payment = new Payment({
                                        package: package,
                                        amount: amount,
                                        numberUsedInPayment: messages[2],
                                        no: no,
                                        date: new Date(),
                                        dayOfYear: dayOfYear(new Date()),
                                        valid: true
                                    });

                                    paymentService.addPayment(payment).then((v) => {
                                        console.log(v);
                                        if (v.valid) {
                                            messageToSend = "Your payment was successful valid for the next 30 days added to your account \n\nRestart(type *#* to restart) ";
                                            messageChain.delete(no);
                                        } else {
                                            essageToSend += "It appears it not successful to add your payment type paid and send again, if this persists,kindly contact the team if you paid, so we can credit your account,BE READY with your payment confirmation, \nClick this link https://wa.me/263719066282?text=Hi+Gigz+I+paid+but+the+payment+did+not+get+reflected+on+your+side \nYou can Restart(type *#* to restart) ";
                                        }
                                        client.sendMessage(msg.from, messageToSend).then((res) => {
                                            // console.log("Res " + JSON.stringify(res));
                                        }).catch(console.error);

                                    }).catch((e) => {
                                        console.error(e);
                                        messageToSend = "Oooops looks like there was an error, please try again, by sending a new message ";
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
                                    messageToSend += "It appears your payment was not successful type paid and send again, if this persists kindly contact the team if you paid, so we can credit your account,BE READY with your payment confirmation, \nClick this link https://wa.me/263719066282?text=Hi+Gigz+I+paid+but+the+payment+did+not+get+reflected+on+your+side \nYou can Restart(type *#* to restart) ";
                                    client.sendMessage(msg.from, messageToSend).then((res) => {
                                        // console.log("Res " + JSON.stringify(res));
                                        messageChain.delete(no);
                                    }).catch(console.error);
                                }
                            } else {
                                messageToSend = "It appears you sent something that is outside of the available options, did you want to confirm payment, send paid or click this link https://wa.me/263713020524?text=paid, if this is not what you want type # to restart";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch((console.error));
                            }
                        } else if (messages[0].substring(messages[0].indexOf("@"), messages[0].length).toLowerCase() === "@va" && messages[0].includes("@va")) {
                            let v = clientMap.get(no); // get the business's profile saved in the map

                            if (messages[1] === "2") {  // Confirm this is option for services


                                if (messages[2] === "1") { // Confirm this is option for create quotation

                                    if (query.split(",").length > 0) { // Ensure query typed in properly
                                        messages.push(query);
                                        messageChain.set(no, messages);
                                        let chosenServices = query.split(",");
                                        let allServices = v.prices.split(",");
                                        messageToSend = `These are the services you chose \n\n`;
                                        for (let index = 0; index < chosenServices.length; index++) {
                                            const element = chosenServices[index] - 1;
                                            if (element < allServices.length) { // Only available services show
                                                messageToSend += `${allServices[element].substring(0, allServices[element].indexOf("="))}  ${allServices[element].substring(allServices[element].indexOf("=") + 1, allServices[element].length)}\n\n`;
                                            }
                                        }
                                        messageToSend += `____________END___________\n`;
                                        messageToSend += `Please confirm these are the services you wanted and send \n*1* Yes, these are the services I want \n*2* No, let me resend the services I want`;
                                    } else { // Quotation query not typed properly
                                        messageToSend += `It appears you did not type in the services you want properly, please try again, if this is not what you want, type # and send to restart`;
                                    }

                                } else {
                                    messageToSend += `${allServices[element].substring(0, allServices[element].indexOf("="))}  ${allServices[element].substring(allServices[element].indexOf("=") + 1, allServices[element].length)}\n\n`;
                                }

                            } else { // outside of expected responses
                                messageToSend = `It appears you did not select one of the available options, please select option 1 or 2 or 3`;

                            }
                            client.sendMessage(msg.from, messageToSend).then((res) => {

                            }).catch(console.error);
                        } else if (messages[0] === "addva") { // Listed FAQs
                            let faqsArray = query.split(",");
                            if (faqsArray.length < 1 || faqsArray === null) {
                                messageToSend = "It appears you did not list your frequently asked questions the right way, please follow these instructions , your clients might have questions, please help them get answers quickly, by sending frequently asked questions in the format question=answer separate each by a comma e.g Do you do house calls?=yes,how much is pedicure if I have my own nails?=To ensure quality we use only our nails which we know the source and works well together the rest of our tools \nOR \nHow secure is your website?=It is very secure and even protected from bots,How long does it take to make a mobile application on average?=It takes 3 weeks for a basic application more complex apps might take longer but never more than 3 months \nOR\nHow big is your truck to move my goods?=We can take every load size 2T, 5T, 10T to carry every load,I have few items that I want to carry local, does that change the price?=No our local prices are fixed";
                            } else {
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend = `These are your questions and answers\n\n`;
                                for (let index = 0; index < faqsArray.length; index++) {
                                    const element = faqsArray[index];
                                    messageToSend += `${index + 1} *${element.substring(0, element.indexOf("="))}*  \n${element.substring(element.indexOf("=") + 1, element.length)}\n\n`;
                                }
                                messageToSend += `Please confirm these are your questions and the answers are correct,  \n*1* Yes, it is correct \n*2* Not correct, can I retype them \nSend the number that shows the option you want e.g 1 to confirm these are correct `;
                            }
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch((console.error));
                        } else { // outside of expected responses
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);
                        }


                        break;
                    case 4:
                        if (messages[1] === "2" && messages[0] === "1073unashe") { // Registering , brief
                            messages.push(query);
                            messageChain.set(no, messages);
                            messageToSend = "Type a brief intro about yourself or your business,you to include in this, your unique services, your service history ,why clients should choose you, and what inspires you";
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);
                        } else if (messages[0].substring(messages[0].indexOf("@"), messages[0].length).toLowerCase() === "@va" && messages[0].includes("@va")) {

                            if (messages[1] === "2") { // confirm its services


                                if (messages[2] === "1") { // confirm its create a quotation


                                    if (query === "1") { // Yes these are the services I want
                                        let v = clientMap.get(no);
                                        // Generate PDF
                                        messages.push(query);
                                        messageChain.set(no, messages);
                                        let chosenServices = messages[3].split(",");
                                        let allServices = v.prices.split(",");
                                        var quotation = {};

                                        // quotation.addresses.billing.number = no.substring(0, no.indexOf("@c.us"));
                                        quotation.name = v.name;
                                        quotation.memo = `Quotation for ${v.name} generated via Gigz`;
                                        quotation.qNumber = invoice;
                                        pdfMap.set(no, invoice); // invoice put on messages[5]

                                        quotation.dueDate = `${new Date().getMonth() + 1}/${new Date().getDate()}/${new Date().getFullYear()}`
                                        let servicesOnQ = [];
                                        let subtotal = 0;
                                        for (let index = 0; index < chosenServices.length; index++) {
                                            const element = chosenServices[index] - 1;
                                            if (element < allServices.length) {
                                                servicesOnQ.push({
                                                    itemCode: element + 1,
                                                    description: allServices[element].substring(0, allServices[element].indexOf("=")),
                                                    // quantity: 2,
                                                    price: allServices[element].substring(allServices[element].indexOf("=") + 1, allServices[element].length),
                                                    amount: allServices[element].substring(allServices[element].indexOf("=") + 1, allServices[element].length)
                                                });
                                                subtotal += parseInt(allServices[element].substring(allServices[element].indexOf("=") + 1, allServices[element].length));
                                            }

                                        }
                                        quotation.items = servicesOnQ;
                                        quotation.subtotal = subtotal;
                                        const qg = new QGenerator(quotation);
                                        qg.generate();
                                        messageToSend = `PDF generated please select one of the options  \n*1* Send it now \n*2* I change my mind delete it \nSend the number of the option you want e.g Send 1 to get the generated Quotation`;

                                    } else if (query === "2") { // Quotation was wrong lets try again
                                        messageChain.delete(no);
                                        messageToSend = `The chat has restarted, you can click on this link to talk to this Chatbot https://wa.me/${gigzBot}?text=${messages[0]}`;
                                        // messageChain.set(no, messages.pop());
                                        // let servicesPrices = query.split(",");
                                        // messageToSend = `Okay let us do this again \n\n`;
                                        // for (let index = 0; index < servicesPrices.length; index++) {
                                        //     const element = servicesPrices[index];
                                        //     messageToSend += `${index + 1} ${element.substring(0, element.indexOf("="))}  ${element.substring(element.indexOf("=") + 1, element.length)}}\n\n`;
                                        // }
                                        // messageToSend += `____________END___________\n`;
                                        // messageToSend += `Type the number of each of the services you want separated by a comma(if you want more than one of the same service, you can list it as many times as you want it)  and send e.g 1,2,3  for services 1 and 2 and 3 \nOR \n2,4,6 for services 2 and 4 and 6 `;
                                    } else {
                                        messageToSend = `It appears you did not select one of the available options, please select option 1 or 2 `;
                                    }

                                } else { // outside of the expected options
                                    messageToSend = `It appears you did not select one of the available options, please select option 1 or 2`;
                                }

                            } else {
                                messageToSend = `It appears you did not select one of the available options, please select option 2, or restart, to restart type # and send`;
                            }
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);
                        } else if (messages[0] === "addva") { // Chatbot created
                            if (query === "1") {
                                messages.push(query);
                                messageChain.set(no, messages);
                                let prices = messages[1];
                                let faqs = messages[3];
                                let name = clientMap.get(no).name;
                                mongoWorker.addVA(no, prices, faqs).then((v) => {
                                    messageToSend = `Chatbot(Virtual Assistant) created, \nFor anyone to use your Virtual Assistant or Chatbot they need to use this link \nhttps://wa.me/${gigzBot}?text=${name.toLowerCase()}@va your name with @va added to it \nIf you ever add more services you can add your service using this link \nhttps://wa.me/${gigzBot}?text=${name.toLowerCase()}@services \nTo add pictures of some of the work you have done use this link \nhttps://wa.me/263713020524?text${name.toLowerCase()}@portfolio`;
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
                            } else if (query === "2") {
                                messageChain.delete(no);
                                messageToSend = `Okay let us do this again, One last question, your clients, might have questions, please help them get answers quickly, by sending frequently asked questions in the format question=answer separate each by a comma\nExamples \n\nDo you do house calls?=yes,how much is pedicure if I have my own nails?=To ensure quality we use only our nails which we know the source and works well together the rest of our tools \nOR \nHow secure is your website?=It is very secure and even protected from bots,How long does it take to make a mobile application on average?=It takes 3 weeks for a basic application more complex apps might take longer but never more than 3 months \nOR\nHow big is your truck to move my goods?=We can take every load size 2T, 5T, 10T to carry every load,I have few items that I want to carry local, does that change the price?=No our local prices are fixed  \n\nClick on this link to restart https://wa.me/${gigzBot}?text=addva`;
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);
                            } else {
                                messageToSend = "Please choose one of the follow options, 1 or 2, what you sent is not within the scope of the current chat, if this is not what you want type #";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);
                            }
                        } else { // outside of the expected options
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);
                        }

                        break;
                    case 5:
                        if (messages[1] === "2" && messages[0] === "1073unashe") { // Registering asking for areas
                            messages.push(query);
                            messageChain.set(no, messages);
                            messageToSend = "Please type the areas your are able to offer services in, include suburb and city, e.g Avondale, Harare, Epworth Harare";
                        } else if (messages[0].substring(messages[0].indexOf("@"), messages[0].length).toLowerCase() === "@va" && messages[0].includes("@va")) {
                            messageChain.delete(no);
                            if (messages[1] === "2") { // confirm its services


                                if (messages[2] === "1") { // confirm its create a quotation
                                    let v = clientMap.get(no);
                                    messages.push(query);
                                    messageChain.set(no, messages);

                                    let filePath = `./${v.name} quotation ${pdfMap.get(no)}.pdf`;

                                    if (messages[4] === "1") { // Yes send now
                                        let mediaMessage = `${v.name} quotation ${pdfMap.get(no)}`;
                                        const media = MessageMedia.fromFilePath(filePath);

                                        client.sendMessage(no, media, { caption: mediaMessage }).catch(console.error);
                                    } else if (messages[4] === "2") { // No delete
                                        fs.unlink(filePath, (err) => {
                                            if (err) {
                                                console.error(err)
                                                return
                                            }

                                            //file removed

                                        });
                                        messageToSend = "Thank you, the file is being deleted";
                                    } else {
                                        messageToSend = "Please select one of the options 1 or 2, e.g send 1 to get the generated pdf";
                                    }
                                    messageChain.delete(no);

                                } else {
                                    messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";

                                }
                            } else {
                                messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";

                            }
                        } else {
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                        }
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                        }).catch(console.error);
                        break;
                    case 6:
                        if (messages[1] === "2" && messages[0] === "1073unashe") { // Registering finishing profile now VA
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

                            let package = clientMap.get(no)[0];


                            var worker = new Worker({
                                name: messages[2].toLowerCase(),
                                category: category,
                                skills: messages[4],
                                brief: messages[5],
                                areas: messages[6],
                                package: package,
                                expired: false,
                                no: no,
                                date: new Date(),
                                id: milliSecondsSinceEpoch
                            });


                            mongoWorker.saveWorker(worker).then((v) => {

                                if (!v.expired) {
                                    messageToSend = `Thank you for your patience, You account profile has been added but we need just two more answers for your Chatbot(Virtual Assistant), answer the follow questions, if for any reason this process gets cut and you need to add a Chatbot(Virtual Assistant or Edit Your Virtual Assistant) click this link https://wa.me/${gigzBot}?text=addva, \nPlease list all your services and the price for each separated by a comma in this format descr=amount and send them, all the you services listed above e.g website deveopmen=100USD, Mobile Application development=300USD \nOR \nMoving goods local(in town)=10USD,Moving goods above 2T=45USD \nOR \nPedicure=7USD,Manicure=10USD`;
                                } else {
                                    messageToSend = `It appears you there was an error saving your profile, could it be, that there is already an account saved on this account? If not, kindly try again later, but if the error persists, please contact us by clicking https://wa.me/${contactUs}?text=Hi+Gigz+It+appears+there+was+an+error+creating+my+account`;
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
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error)
                        }

                        break;
                    case 7:
                        if (messages[1] === "2" && messages[0] === "1073unashe") { // Registered VA
                            let servicesArray = query.split(",");
                            if (servicesArray.length < 1 || servicesArray === null) {
                                messageToSend = "It appears you did not list your services the right way, please follow these instructions , we need just two more answers for your Virtual Assistant, please list all your services and the price for each separated by a comma in this format descr=amount and send them, all the you services listed above e.g website deveopmen=100USD, Mobile Application development=300USD \nOR \nMoving goods local(in town)=10USD,Moving goods above 2T=45USD \nOR \nPedicure=7USD,Manicure=10USD";

                            } else {
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend = `These are your services and prices, your Virtual Assistant will use this to send quotations to people \n`;
                                for (let index = 0; index < servicesArray.length; index++) {
                                    const element = servicesArray[index];
                                    messageToSend += `${index + 1} ${element.substring(0, element.indexOf("="))}  ${element.substring(element.indexOf("=") + 1, element.length)}\n\n`;
                                }
                                messageToSend += `Please confirm these are your services and the prices are correct \n*1* Yes, it is correct \n*2* Not correct, can I retype them \nSend the number that shows the option you want e.g 1 to confirm these are correct `;
                            }
                        } else {
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                        }
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                        }).catch(console.error);
                        break;
                    case 8:
                        if (messages[1] === "2" && messages[0] === "1073unashe") { // Confirm FAQs or resend them
                            if (query === "1") {
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend = "One last question, your clients, might have questions, please help them get answers quickly, by sending frequently asked questions in the format question=answer separate each by a comma \n\n.g Do you do house calls?=yes,how much is pedicure if I have my own nails?=To ensure quality we use only our nails which we know the source and works well together the rest of our tools \nOR \nHow secure is your website?=It is very secure and even protected from bots,How long does it take to make a mobile application on average?=It takes 3 weeks for a basic application more complex apps might take longer but never more than 3 months \nOR\nHow big is your truck to move my goods?=We can take every load size 2T, 5T, 10T to carry every load,I have few items that I want to carry local, does that change the price?=No our local prices are fixed";
                            } else if (query === "2") {
                                messageToSend = `Okay let us do this again to add your Chatbot(Virtual Assistant) to add click this link https://wa.me/${gigzBot}?text=addva`;
                                messageChain.delete(no);
                            } else {
                                messageToSend = "This response is out of the expected one, Please send one of the options indicated above 1 or 2 or 3 or 4";
                            }
                        } else {
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                        }
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                        }).catch(console.error);
                        break;
                    case 9:
                        if (messages[1] === "2" && messages[0] === "1073unashe") {
                            let faqsArray = query.split(",");
                            if (faqsArray.length < 1 || faqsArray === null) {
                                messageToSend = "It appears you did not list your frequently asked questions the right way, please follow these instructions , your clients might have questions, please help them get answers quickly, by sending frequently asked questions in the format question=answer separate each by a comma e.g Do you do house calls?=yes,how much is pedicure if I have my own nails?=To ensure quality we use only our nails which we know the source and works well together the rest of our tools \nOR \nHow secure is your website?=It is very secure and even protected from bots,How long does it take to make a mobile application on average?=It takes 3 weeks for a basic application more complex apps might take longer but never more than 3 months \nOR\nHow big is your truck to move my goods?=We can take every load size 2T, 5T, 10T to carry every load,I have few items that I want to carry local, does that change the price?=No our local prices are fixed";
                            } else {
                                messages.push(query);
                                messageChain.set(no, messages);
                                messageToSend = `These are your questions and answers\n\n`;
                                for (let index = 0; index < faqsArray.length; index++) {
                                    const element = faqsArray[index];
                                    messageToSend += `${index + 1} *${element.substring(0, element.indexOf("="))}*  \n${element.substring(element.indexOf("=") + 1, element.length)}\n\n`;
                                }
                                messageToSend += `Please confirm these are your questions and the answers are correct,  \n*1* Yes, it is correct \n*2* Not correct, can I retype them \n\nSend the number that shows the option you want e.g 1 to confirm these are correct `;
                            }
                        } else {
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                        }
                        client.sendMessage(msg.from, messageToSend).then((res) => {
                            // console.log("Res " + JSON.stringify(res));
                        }).catch(console.error);
                        break;
                    case 10:
                        if (messages[1] === "2" && messages[0] === "1073unashe") { // Adding VA information
                            if (query === "1") {
                                messages.push(query);
                                messageChain.set(no, messages);
                                let prices = messages[7];
                                let faqs = messages[9];
                                mongoWorker.addVA(no, prices, faqs).then((v) => {
                                    let website = "";
                                    let package = clientMap.get(no)[0];
                                    if (package === "7.99") {
                                        website = `\nThe link to your web page is \nhttp://${messages[2]}.gigz.co.zw, you can use it to market your services, to add your picture use this link \nhttps://wa.me/${gigzBot}?text=${milliSecondsSinceEpoch}@pic , this picture will make your web page look even nicer, also use links above to add pictures of the work you've done, that helps you get clients`;
                                    }
                                    messageToSend = `Account successfully saved, now we start marketing your services, \nFor anyone to use your Virtual Assistant or Chatbot they need to use this link \nhttps://wa.me/${gigzBot}?text=${messages[2].toLowerCase()}@va your name with @va added to it \nFor anyone to add recommendations for your services,(You should encorage your clients to do so because this helps you get more clients) this should use this link \nhttps://wa.me/${gigzBot}?text=${messages[2].toLowerCase()}@rate which is your name added @rate  \nIf you ever add more services you can add your service using this link \nhttps://wa.me/${gigzBot}?text=addva \nTo add pictures of some of the work you have done use this link \nhttps://wa.me/${gigzBot}?text=${messages[2].toLowerCase()}@portfolio  ${website} \nCongratulations on getting started on Gigz, we look foward to working together,marketing your services and giving you tools to improve your operations and efficies`;
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
                            } else if (query === "2") {
                                messageToSend = `Okay let us do this again to add your Chatbot(Virtual Assistant) to add click this link https://wa.me/${gigzBot}?text=addva`;
                                messageChain.delete(no);
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);
                            } else {
                                messageToSend = "Please choose one of the follow options, 1 or 2, what you sent is not within the scope of the current chat, if this is not what you want type #";
                                client.sendMessage(msg.from, messageToSend).then((res) => {
                                    // console.log("Res " + JSON.stringify(res));
                                }).catch(console.error);
                            }
                        } else {
                            messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                            messageChain.delete(no);
                            client.sendMessage(msg.from, messageToSend).then((res) => {
                                // console.log("Res " + JSON.stringify(res));
                            }).catch(console.error);
                        }
                        break;
                    default:
                        messageToSend = "This response is out of the expected one, this chat has been restarted, send hi to choose the option you want";
                        messageChain.delete(no);
                        break;
                }

            } else { // user has not communicated yet, welcome them

                messages.push("1073unashe");
                messageChain.set(no, messages);
                var timeOfDay = "";
                if (new Date().getHours() < 12) {
                    timeOfDay = "Morning";
                } else if (new Date().getHours() > 12 && new Date().getHours() < 16) {
                    timeOfDay = "Afternoon";
                } else {
                    timeOfDay = "Day";
                }

                messageToSend = `Pleasant ${timeOfDay} ${name}, welcome to Gigz \n\n \n*1* Search for a service \n*2* Register \n*3* How does this work?   \n\nSend the number of the option you want, e.g send 2 if you want to register as a service provider`;

                client.sendMessage(msg.from, messageToSend).then((res) => {

                }).catch(console.error);

            }

        }




    }








});

// My useful functions

const checkPayment = no => {
    let day = dayOfYear(new Date);
    try {
        return paymentService.checkSubscriptionStatus(no, day)
    } catch (e) {
        console.error(e);
    }
}

const dayOfYear = date =>
    Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);

const isValidPhoneNumber = p => {
    var sentences = p.split(/\r?\n/);
    for (let i = 0; i < sentences.length; i++) {
        var phoneRe = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
        var digits = sentences[i].replace(/\D/g, "");
        if (phoneRe.test(digits)) {
            return phoneRe.test(digits);
        }
    }

    return false;
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

app.post('/api/v1/message', (req, res) => {

    var contacts = req.body.contacts.split(",");
    contacts.forEach(element => {

        var id = `263${element}@c.us`;
        client.sendMessage(id, req.body.message).then(() => {
            console.log(`Sent message to ${element}`);
        }).catch(console.error);


    });

    res.send("hi");



});

app.post('/api/v1/checkpayments', async (req, res) => {

    var clients = await paymentService.getAllPayments();
    clients.forEach(element => {

        let id = element.no;
        checkPayment(id).then((oneClient) => {

            let statement = "";
            if (!oneClient.expired && checkPayment(id).days < 6) {
                statement = `only ${days} left`;
            } else if (oneClient.expired) {
                statement = `expired`;
            }
            var messageToSend = `Good day \nKindly note your subscription has , ensure you resubscribe soon so you *continue* to get full access to our services and say guard your unique username, which maybe taken by someone else if the account is not in use for a long time`;
            client.sendMessage(id, messageToSend).then(() => {
                console.log(`Sent to ${element.no}`);
            }).catch(console.error);
        }).catch(console.error);


    });


});




app.listen(port, () => {
    console.log("Server Running Live on Port : " + port);
});
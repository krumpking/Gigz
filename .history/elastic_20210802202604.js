const { Client } = require('elasticsearch');
const elasticSearchClient = new Client({ 
  node: 'http://localhost:9200',
  // log: 'trace'
 });


 module.exports = {
    addRentalPropertyLeads: async function (id,description) {
        const res = await elasticSearchClient.create({
            index: 'rentalpropertyleads',
            id: id,
            body: {
                no: id,
                description: description,
                date: new Date(),
            }
        });
        
        return res;
    },
    addRentalPropertySearchers: async function (budget, beds){
        const res = await elasticSearchClient.create({
            index: 'propertysearchers',
            id: id,
            body: {
                no: id,
                date: new Date(),
                budget: budget,
                beds: beds,
            }
        });
        
        return res;
    },
    addUniqueVisitors: async function (id){
        var now = new Date();
        var start = new Date(now.getFullYear(), 0, 0);
        var diff = now - start;
        var oneDay = 1000 * 60 * 60 * 24;
        var day = Math.floor(diff / oneDay); 
        const res = await elasticSearchClient.create({
            index: 'visitors',
            id: id,
            body: {
                no: id,
                date: new Date(),
                day:day,
            }
        });
        
        return res;
    },
    addVisitors: async function (id){

        const secondsSinceEpoch = Math.round(Date.now() / 1000);

        const res = await elasticSearchClient.create({
            index: 'visitors',
            id: secondsSinceEpoch,
            body: {
                no: id,
                date: new Date(),
            }
        });
        
        return res;
    },
    addDayOfSubscriptions: async function (){
        const secondsSinceEpoch = Math.round(Date.now() / 1000);
        var now = new Date();
        var start = new Date(now.getFullYear(), 0, 0);
        var diff = now - start;
        var oneDay = 1000 * 60 * 60 * 24;
        var day = Math.floor(diff / oneDay); 
        const res = await elasticSearchClient.create({
            index: 'subscriptionday',
            id: day,
            body: {
                day: day,
            }
        });
        
        return res;
    },
    addHits: async function (id){

        const secondsSinceEpoch = Math.round(Date.now() / 1000);
        var now = new Date();
        var start = new Date(now.getFullYear(), 0, 0);
        var diff = now - start;
        var oneDay = 1000 * 60 * 60 * 24;
        var day = Math.floor(diff / oneDay); 
        const res = await elasticSearchClient.create({
            index: 'hits',
            id: secondsSinceEpoch,
            body: {
                no: id,
                date: new Date(),
                day: day,
            }
        });
        
        return res;
    },
    addRentalPropertySubscriptionPayments: async function (id){
        const res = await elasticSearchClient.create({
            index: 'rentalpropertypayments',
            id: id,
            body: {
                no: id,
                amount: 720,
                date: new Date(),
            }
        });
        
        return res;
    },
    addRentalPropertyReports: async function (id,details){

        const secondsSinceEpoch = Math.round(Date.now() / 1000);
        
        const res = await elasticSearchClient.create({
            index: 'rentalpropertyreports',
            id: secondsSinceEpoch,
            body: {
                no: id,
                details: details,
                date: new Date(),
            }
        });
        
        return res;
    },
    addRentalPropertyClientOnSearch: async function (id,name,whereFrom, description,suburbs,budget,beds) {
        const res = await elasticSearchClient.create({
            index: 'rentalpropertyclients',
            id: id,
            body: {
                whereFrom: whereFrom,
                description: description,
                suburbs: suburbs,
                budget:budget,
                beds: beds,
                name: name,
                
            }
        });

        return res;
    },
    addSubscription: async function (id,clientObject,day) {
        const res = await elasticSearchClient.create({
            index: 'subs',
            id: id,
            body: {
                whereFrom: clientObject.whereFrom,
                description: clientObject.description,
                suburbs: clientObject.suburbs,
                budget:clientObject.budget,
                beds: clientObject.beds,
                name: clientObject.name,
                day:day,
                
            }
        });

        return res;
    },
    updateRentalPropertyClient: async function (id,name,whereFrom, description,suburbs,budget,beds) {
        const res = await elasticSearchClient.update({
            index: 'rentalpropertyclients',
            id: id,
            body: {
                doc: {
                    whereFrom: whereFrom,
                    description: description,
                    suburbs: suburbs,
                    budget:budget,
                    beds: beds,
                    name: name,
                }
                
                
            }
        });
        
        return res;
    },
    getRentalPropertyClient: async function (id)  {
        var res = elasticSearchClient.search({
            index: 'rentalpropertyclients',
            body: {
                query: {
                    match: {
                        _id: id,
                    }
                }
            }
        })
        
      return res;
    
    },
    getSubscriptionDay: async function ()  {
        var now = new Date();
        var start = new Date(now.getFullYear(), 0, 0);
        var diff = now - start;
        var oneDay = 1000 * 60 * 60 * 24;
        var day = Math.floor(diff / oneDay); 
        var res = elasticSearchClient.search({
            index: 'subscriptionday',
            body: {
                query: {
                    match: {
                    day: day,
                    }
                }
            }
        })
        
      return res;
    
    },
    getVisitor: async function (id)  {
        var res = elasticSearchClient.search({
            index: 'visitors',
            body: {
                query: {
                    match: {
                        _id: id,
                    }
                }
            }
        })
        
      return res;
    
    },
    getAllRentalPropertyClients: async function ()  {
        const res = await elasticSearchClient.search({
            index: 'rentalpropertyclients',
            body: {
                query: {
                   match_all : {
        
                   }
                }
            }
          })
        
        return res;

    },
    getRentalProperty: async function (budget,beds,from) {
        const res = elasticSearchClient.search({
            index: 'rentalproperty',
            body: {
                from: from,
			    size:5,
                query: {
                    bool : {
                    must: [
                    {
                        range : {
                            rent : {
                                lte : budget
                            }
                        },
                    },
                    {
                        match : {
                            beds : beds
                        },
                    },
                    {
                        match : {
                            available : true,
                        },
                    }
					
                    ],
                    }
                }
        }
         });

        return res;
    },
    getRentalPropertyClientMatches: async function (clientObject,from){
        const res = elasticSearchClient.search({
            index: 'rentalproperty',
            body: {
                from: from,
			    size:7,
                query: {
                   bool : {
                    should:[
                    {
                        match : {
                            rent : clientObject.budget,
                        },
                    },
                    {
                        match : {
                            beds : clientObject.beds,
                        },
                    },
                    {
                        match : {
                            available : true,
                        },
                    },
                    {
                        match_phrase: {
                            description: clientObject.description,
                        }
                    },
                    {
                        match_phrase: {
                            suburb: clientObject.suburbs,
                        }
                    },
                    {
                        fuzzy: {
                            suburb: {
                                value: clientObject.suburbs
                            }
                        }
                    },
                    {
                        match_phrase: {
                            description: clientObject.whereFrom,
                        }
                    },
                    ]
                  }
                }
            }
          });

        return res;
        
    },
    deleteRentalPropertyClient: async function (id)  {
        const res = await client.delete({
            index: "rentalpropertyclients",
            id: id,
            });
        
        return res;
    },
    getAds: async function (){
        const res = await elasticSearchClient.search({
            index: 'ads',
            body: {
                query: {
                    match: {
                        active : true,
   
                    },
                
                }
            }
          })
        
        return res;
    },
    updateHits : async function(no,ad){
        
        var ppleWhoSawTheAd = ad._source.seenBy;
        ppleWhoSawTheAd.push(no);
        const res = await elasticSearchClient.update({
            index: 'ads',
            id: ad._id,
            body: {
                doc: {
                    seenBy: ppleWhoSawTheAd,
                }
                
                
            }
        });
        
        return res;      

        
        
        
    }
 

 }
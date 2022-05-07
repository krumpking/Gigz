const { Client } = require('elasticsearch');
const elasticSearchClient = new Client({ 
  node: 'http://localhost:9200',
  // log: 'trace'
 });


 module.exports = {
    addRentalPropertyLeads: async function (id,description) {
		var now = new Date();
        var start = new Date(now.getFullYear(), 0, 0);
        var diff = now - start;
        var oneDay = 1000 * 60 * 60 * 24;
        var day = Math.floor(diff / oneDay); 
        const res = await elasticSearchClient.create({
            index: 'rentalpropertyleads',
            id: id,
            body: {
                no: id,
                description: description,
                date: new Date(),
				day: day
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
            index: 'uniquevisitors',
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
        var now = new Date();
        var start = new Date(now.getFullYear(), 0, 0);
        var diff = now - start;
        var oneDay = 1000 * 60 * 60 * 24;
        var day = Math.floor(diff / oneDay); 

        const res = await elasticSearchClient.create({
            index: 'visitors',
            id: secondsSinceEpoch,
            body: {
                no: id,
                date: new Date(),
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
    sendSubscription: async function (counter)  {
        var res = await elasticSearchClient.search({
            index: 'subs',
            body: {
              from: parseInt(counter),
              size: 10,
              query:{
                match_all :{}
              }
            }
          });
        
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

        
        
        
    },
    addExpWithAgents: async function (id,exp){
        var now = new Date();
        var start = new Date(now.getFullYear(), 0, 0);
        var diff = now - start;
        var oneDay = 1000 * 60 * 60 * 24;
        var day = Math.floor(diff / oneDay); 
        const secondsSinceEpoch = Math.round(Date.now() / 1000);
        const res = await elasticSearchClient.create({
            index: 'expagents',
            id: secondsSinceEpoch,
            body: {
                no: id,
                date: new Date(),
                day:day,
                approved: false,
                exp: exp,
            }
        });
        
        return res;
    },
    getExpWithAgents: async function (from){
        const res = elasticSearchClient.search({
            index: 'expagents',
            body: {
                from: from,
			    size:3,
                sort:[
                    {date:"desc"}
                  ],
                query: {
                  bool: {
                      must: [
                            {
                                match : {
                                    approved : true,
                                },
                            },
                      ]
                  }
                }
            }
          });

        return res;
        
    },
    addExpBySub: async function (id,exp,sub){
        var now = new Date();
        var start = new Date(now.getFullYear(), 0, 0);
        var diff = now - start;
        var oneDay = 1000 * 60 * 60 * 24;
        var day = Math.floor(diff / oneDay); 
        const secondsSinceEpoch = Math.round(Date.now() / 1000);
        const res = await elasticSearchClient.create({
            index: 'expbysub',
            id: secondsSinceEpoch,
            body: {
                no: id,
                date: new Date(),
                day:day,
                exp: exp,
                sub: sub,
                approved: false,
            }
        });
        
        return res;
    },
    getExpBySub: async function (from,clientObject){
        const res = elasticSearchClient.search({
            index: 'expbysub',
            body: {
                from: from,
			    size:3,
                query: {
                   bool : {
                    must: [
                        {
                            match : {
                                approved : true,
                            },
                        },
                    ],
                    should:[
                    {
                        match_phrase: {
                            sub: clientObject.suburbs,
                        }
                    },
                    {
                        fuzzy: {
                            sub: {
                                value: clientObject.suburbs
                            }
                        }
                    },
                    {
                        match_phrase: {
                            sub: clientObject.whereFrom,
                        }
                    },
                    ]
                  }
                }
            }
          });

        return res;
        
    },
	subscriptionCount: async function() {
		var res = await elasticSearchClient.count({
		  index: 'subs'
	  });
	  
	  return res;
	},
    getLeads: async function(counter) {
        var res = await elasticSearchClient.search({
            index: 'rentalpropertyleads',
            body: {
              from: parseInt(counter),
              size: 10,
              sort:[
                {date:"desc"}
              ],
            }
          });

        return res;
    },
    addRentalProperty : async function(rent,suburb,city,beds,description,from,contact,author,day) {

        const secondsSinceEpoch = Math.round(Date.now() / 1000);
        var result = await elasticSearchClient.create({
            index: 'rentalproperty',
            id: secondsSinceEpoch,
            body: {
              rent: rent,
              suburb: suburb,
              city: city,
              beds: beds,
              description: description,
              from: from,
              date: new Date(),
              contact: contact,
              available: true,
              author: author,
              day: day, //day of the year
            }
        });

        return result;

       
    },
	resetRentalProperty: async function(dayForAgentLandlords) {
		var res = elasticSearchClient.deleteByQuery({
		index: 'rentalproperty',
		body: {
		  query: {
				  range: {
					day : {
						lte : dayForAgentLandlords,
						}
					}
		  }
		},
	  })
	  
	  return res;
	},
	deleteRentalProperty: async function(dayForAgentLandlords) {
		var res = await elasticSearchClient.delete({
		index: "rentalproperty",
		id: id
		});
		
		return res;
	},
	getRentalPropertybyDescription: async function(descr) {
		var res = await elasticSearchClient.search({
		  index: 'rentalproperty',
		  body: { 
			query : {
			  match: {
				description: descr,
			  }
			}
		   
		  }    
		 });
		 
		 return res.hits.hits;
	},
	getRentalPropertyByContact: async function (contact) {
	  var res = await elasticSearchClient.search({
	  index: 'rentalproperty',
	  body: { 
		query : {
		  match: {
			contact: contact,
		  }
		}
	   
	  }    
	 });
	 
	 return res.hits.hits;
  },


 }
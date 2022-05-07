const { Client } = require('elasticsearch');
const elasticSearchClient = new Client({ 
  node: 'http://localhost:9200',
  // log: 'trace'
 });


 module.exports = {
    getClient: async function (id)  {
        const res = await elasticSearchClient.get({
            index: 'clients',
            id: id
        });
        
        return res;

    },
    createClient: async function (id) {
        const res = elasticSearchClient.create({
            index: 'houses',
            id: 100,
            body: {
                rent: 450,
                suburb: 'Tynwald',
                beds: 3,
                description: "Tynwald north 1big room floor, ceiling, mugodi, walled gated 70 single lady/ guy Mabelreign 3rooms cottage walled gated 200",
                date: new Date()
            }
        });
        
        return res;

    },
    updateClient: async function (id) {
         
    },
    deleteClient: async function (id)  {
         
    },
    addHouses: async function (id) {
         
    },
    addLeads: async function (id) {
         
    },
    getHouses: async function (id) {
         
    },
    getClientHousesMatches: async function (){
    
    },
    addSearchers: async function (){
    
    },
    addVisitors: async function (){
    
    },
    addPayments: async function (){
    
    },
 

 }
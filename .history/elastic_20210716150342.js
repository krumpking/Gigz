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
    createClient: async function (id,name) {
        const res = elasticSearchClient.create({
            index: 'clients',
            id: id,
            body: {
                name: name,
                no: id,
                 date: new Date()
            }
        });
        
        return res;

    },
    updateClientOnSearch: async function (id) {
        const res = elasticSearchClient.update({
            index: 'clients',
            id: id,
            body: {
                doc: {
                    rent: 70,
                }
            }
        })
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
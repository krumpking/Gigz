const { Client } = require('elasticsearch');
const elasticSearchClient = new Client({ 
  node: 'http://localhost:9200',
  // log: 'trace'
 });

 
 exports.getClient = (id) => {
        elasticSearchClient.get({
            index: 'clients',
            id: id
        }).then((res) => {
        //   console.log(res.hits.hits);
            return res;
        })
};
 

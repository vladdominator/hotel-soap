const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');

// MongoDB connection setup
mongoose.connect('mongodb+srv://vladdominator:test1234@cluster0.qm6xehv.mongodb.net/hotel-app-base?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

// Parsing the request body in XML format
app.use(bodyParser.text({ type: 'text/xml' }));

const sendXml = (res, body) => {
    const xmlResponse = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:web="http://example.com/userDetailsService">
        <soapenv:Body>
            <web:saveTransaction>
              ${body}
            </web:saveTransaction>
        </soapenv:Body>
      </soapenv:Envelope>`;

    res.set('Content-Type', 'text/xml');
    res.send(xmlResponse);
}

app.post('/transactions', (req, res) => {
    // Convert input XML to JS object
    xml2js.parseString(req.body, async (err, result) => {
        if (err) {
            res.status(400).send('An error occurred while processing input data.');
            return;
        }

        const sender = result['soapenv:Envelope']['soapenv:Body'][0]['web:saveTransaction'][0]['web:sender'][0];
        const receiver = result['soapenv:Envelope']['soapenv:Body'][0]['web:saveTransaction'][0]['web:receiver'][0];
        const amount = result['soapenv:Envelope']['soapenv:Body'][0]['web:saveTransaction'][0]['web:amount'][0];

        const Transaction = mongoose.model('Transaction');
        const transaction = new Transaction({sender, receiver, amount});
        transaction.save().then((s) => {
            sendXml(res, `<web:idTransaction>${s._id}</web:idTransaction>`)
        }).catch((error) => {
            sendXml(res, `<web:error>${error}</web:error>`)
        })
    })
});

app.listen(3000, () => {
    console.log('Starting the server on port 8000');
});
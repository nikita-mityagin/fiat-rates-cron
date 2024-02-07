import axios from 'axios';
import {Client, Databases} from "node-appwrite";

export default async function fetchAndSaveRates(context) {
    console.log("ENV: ", process.env);
    try {
        let client = new Client();
        let database = new Databases(client);
        client.setEndpoint("https://cloud.appwrite.io/v1");
        client.setProject(process.env.PROJECT_ID);
        client.setKey(process.env.APPWRITE_API_KEY);

        const response = await axios.get(`https://api.currencyapi.com/v3/latest?apikey=${process.env.RATES_API_KEY}`);
        const rates = response?.data ?? {};

        console.log("rates", rates);

        const ratesArray = Object.keys(rates).map(key => [key, rates[key].value]);

        // Format the date as DDMMYYYY
        const dateStr = new Date().toLocaleDateString("en-GB").replace(/\//g, '');

        // Check if a document with this date already exists
        let searchResponse = await database.listDocuments(process.env.COLLECTION_ID, [`date=${dateStr}`]);
        let documentId = searchResponse.documents.length > 0 ? searchResponse.documents[0].$id : null;

        let document = {
            date: dateStr,
            jsonRates: JSON.stringify(ratesArray)
        };

        if (documentId) {
            // Update the existing document
            await database.updateDocument(process.env.COLLECTION_ID, documentId, document);
        } else {
            // Create a new document
            await database.createDocument(process.env.COLLECTION_ID, document);
        }
        return context?.res ? context.res.json({ ok: true, rates: rates }) : undefined;
    } catch (error) {
        console.error("Error fetching or saving rates:", error);
        return context?.res ? context.res.json({ ok: false, error: error }) : undefined;
    }
}

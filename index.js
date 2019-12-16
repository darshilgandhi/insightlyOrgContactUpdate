exports.handler = function (event, context, callback) {

    var rp = require('request-promise');
    var request = require('request');
    //Mock Event Data, actual data to arrive from API Gateway
    //var event = { "entity": { "ORGANISATION_ID": 137789275, "ORGANISATION_NAME": "Evan's Auto Care", "BACKGROUND": null, "IMAGE_URL": null, "OWNER_USER_ID": 1538821, "DATE_CREATED_UTC": "2019-06-25T17:18:46.877", "DATE_UPDATED_UTC": "2019-09-04T03:32:21.543", "LAST_ACTIVITY_DATE_UTC": null, "NEXT_ACTIVITY_DATE_UTC": null, "CREATED_USER_ID": 1538821, "PHONE": "(609) 781-5424", "PHONE_FAX": null, "WEBSITE": "https://www.evansautocare.com/", "ADDRESS_BILLING_STREET": null, "ADDRESS_BILLING_CITY": null, "ADDRESS_BILLING_STATE": null, "ADDRESS_BILLING_COUNTRY": null, "ADDRESS_BILLING_POSTCODE": null, "ADDRESS_SHIP_STREET": "9190 Plainfield Rd.", "ADDRESS_SHIP_CITY": "Cincinnati", "ADDRESS_SHIP_STATE": "OH", "ADDRESS_SHIP_POSTCODE": "45236", "ADDRESS_SHIP_COUNTRY": null, "SOCIAL_LINKEDIN": null, "SOCIAL_FACEBOOK": null, "SOCIAL_TWITTER": null, "CUSTOMFIELDS": [{ "FIELD_NAME": "BSC__c", "FIELD_VALUE": "BSC1399" }, { "FIELD_NAME": "Industry__c", "FIELD_VALUE": "Auto Repair Mechanic" }, { "FIELD_NAME": "ORGANISATION_FIELD_5", "FIELD_VALUE": false }, { "FIELD_NAME": "ORGANISATION_FIELD_6", "FIELD_VALUE": false }, { "FIELD_NAME": "ORGANISATION_FIELD_7", "FIELD_VALUE": false }], "TAGS": [], "DATES": [], "EMAILDOMAINS": [] } };



    //reading event object data - org ID and  Industry
    var orgID = event["entity"]["ORGANISATION_ID"];
    var orgIndustry = "";
    var customFields = event["entity"]["CUSTOMFIELDS"];
    customFields.forEach(function (element) {
        if (element["FIELD_NAME"] === 'Industry__c') {
            orgIndustry = element["FIELD_VALUE"];
        }
    });


    //null values here indicate event data read error
    console.log("orgID: " + orgID + " | orgIndustry: " + orgIndustry);

    //setting up for 1st API call - GET links of all contacts to this Org
    var baseURL = "https://api.insightly.com/v3.1";
    var insightlyHeaders = {
        'User-Agent': 'Request-Promise',
        'Authorization': 'Basic ZDA2MjQ1MTYtNjEwZC00YTNkLWJmMjQtNmJkYzdmM2QwMTc3Og==',
        'Content-Type': 'application/json'
    };

    var options1 = {
        uri: baseURL + '/Organisations/' + orgID + '/Links',
        headers: insightlyHeaders,
        json: true, // Automatically parses the JSON string in the response
    };

    //function returns array of found contacts. Each contact will require an API call for PUT update
    function findContacts(parsedBody) {
        var foundContacts = [];
        parsedBody.forEach(function (element) {
            if (element["LINK_OBJECT_NAME"] === 'Contact') {
                foundContacts.push(element["LINK_OBJECT_ID"]);
            }
        });
        return foundContacts;
    }

    rp(options1)
        .then(function (parsedBody) {
            console.log("==== Org Links After 1st API Call ====");
            console.log(parsedBody);
            console.log("========");
            var foundContacts = findContacts(parsedBody);
            //for each contact, an API call must be made to update their Industry field. Hence the forEach loop
            //testing with just 1 contact

            foundContacts.forEach(function (element) {
                var value = element;
                console.log("==== Commencing PUT request with for contact ID: " + value + " ====");
                var options2 = {
                    method: 'PUT',
                    uri: baseURL + '/Contacts/' + value,
                    headers: insightlyHeaders,
                    body: {
                        "CONTACT_ID": value,
                        "BACKGROUND": "Updated via AWS!",
                        "CUSTOMFIELDS": [{
                            "FIELD_NAME": "CONTACT_FIELD_3",
                            "FIELD_VALUE": orgIndustry
                        }]
                    },
                    json: true // Automatically parses the JSON string in the response
                };

                rp(options2)
                    .then(function (responseBody) {
                        console.log("Updated Contact Successfully with following response below:");
                        console.log(JSON.stringify(responseBody));
                        console.log("==========END==========");
                    })
                    .catch(function (error) {
                        console.log("Failed Contact Update");
                        console.log(error);
                    });
            });
        })
        .catch(function (err) {
            // API call failed...
            console.log("==== 1st API Call Failed ====");
            console.log(err);
        });

};
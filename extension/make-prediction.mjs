export async function predictAsync({
  clientCredentials,
  predictionID,
  outcomeID,
  points,
}) {
  let transactionID = predictionID;
  let body = [
    {
      "operationName": "MakePrediction",
      "variables": {
        "input": {
          "eventID": predictionID,
          "outcomeID": outcomeID,
          "points": points,
          "transactionID": transactionID,
        },
      },
      "extensions": {
        "persistedQuery": {
          "version": 1,
          "sha256Hash":
            "b44682ecc88358817009f20e69d75081b1e58825bb40aa53d5dbadcc17c881d8",
        },
      },
    },
  ];

  let result = await fetch("https://gql.twitch.tv/gql", {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US",
      "authorization": clientCredentials.authorization_header,
      "client-integrity": clientCredentials.client_integrity,
      "client-id": clientCredentials.client_id,
      "client-session-id": clientCredentials.session_id,
      "client-version": "9de5038a-c44b-49d2-ab46-20b6ad807deb",
      "x-device-id": clientCredentials.device_id,
    },
    "referrer": "https://www.twitch.tv/",
    "body": JSON.stringify(body),
    "method": "POST",
  }).then((res) => res.json());
  if (result[0].errors?.length > 0) {
    throw new Error(result[0].errors[0].message);
  }
}

/*
Request:
[
  {
    "operationName": "MakePrediction",
    "variables": {
      "input": {
        "eventID": "77d88265-1290-45c3-be09-0d001becc3dd",
        "outcomeID": "b625ae61-ca0c-4f61-b237-2218651ec051",
        "points": 10,
        "transactionID": "4a26410425a39e05729c63b57ac2b786"
      }
    },
    "extensions": {
      "persistedQuery": {
        "version": 1,
        "sha256Hash": "b44682ecc88358817009f20e69d75081b1e58825bb40aa53d5dbadcc17c881d8"
      }
    }
  }
]

Response:
[
    {
        "data": {
            "makePrediction": {
                "error": null,
                "__typename": "MakePredictionPayload"
            }
        },
        "extensions": {
            "durationMilliseconds": 106,
            "operationName": "MakePrediction",
            "requestID": "01H5E6W22RNDG7QBBT5JVQZFVH"
        }
    }
]
*/

export async function getActiveChannelPredictionAndChannelID(
  client_credentials,
  channel_name,
) {
  let body = [
    {
      operationName: "ChannelPointsPredictionContext",
      variables: { count: 1, channelLogin: channel_name },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash:
            "beb846598256b75bd7c1fe54a80431335996153e358ca9c7837ce7bb83d7d383",
        },
      },
    },
    {
      operationName: "ChannelPointsPredictionBadges",
      variables: {},
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash:
            "36995b30b22c31d1cd0aa329987ac9b5368bb7e6e1ab1df42808bdaa80a6dbf9",
        },
      },
    },
    {
      operationName: "ChannelPointsContext",
      variables: {
        channelLogin: channel_name,
        includeGoalTypes: ["CREATOR", "BOOST"],
      },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash:
            "1530a003a7d374b0380b79db0be0534f30ff46e61cffa2bc0e2468a909fbc024",
        },
      },
    },
    {
      operationName: "ChannelPointsGlobalContext",
      variables: {},
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash:
            "d3fa3a96e78a3e62bdd3ef3c4effafeda52442906cec41a9440e609a388679e2",
        },
      },
    },
  ];

  let result = await fetch("https://gql.twitch.tv/gql", {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US",
      "authorization": client_credentials.authorization_header,
      "client-id": client_credentials.client_id,
      "client-session-id": client_credentials.session_id,
      "client-version": "9de5038a-c44b-49d2-ab46-20b6ad807deb",
      "x-device-id": client_credentials.device_id,
    },
    "referrer": "https://www.twitch.tv/",
    "body": JSON.stringify(body),
    "method": "POST",
  }).then((res) => res.json());

  return {
    prediction: resultToPredictionSettings(result),
    channelID: result[0].data.community.channel.id,
  };
}

// predictionSettings: {
//   status: 'active' | 'locked' | 'none',
//   // non-null if .status !== 'none':
//   outcomes: {color: 'BLUE' | 'PINK', iconURI: string, name: string}[] | null,
//   // non-null if .status !== 'none':
//   title: string | null,
//   // non-null if .status === 'active'
//   deadlineTimeMS: number | null,
// }
function resultToPredictionSettings(result) {
  let { activePredictionEvents, lockedPredictionEvents } =
    result[0].data.community.channel;
  let predictionEvents = [...activePredictionEvents, ...lockedPredictionEvents];
  console.assert(predictionEvents.length <= 1);
  let predictionSettings = predictionEvents.map((prediction) => {
    let { id, title, status, outcomes, createdAt, predictionWindowSeconds } =
      prediction;
    let deadlineTimeMS = new Date(createdAt).getTime() +
      predictionWindowSeconds * 1000;
    let predictionSettings = {
      status: status.toLowerCase(),
      predictionID: id,
      outcomes: outcomes.map((outcome) => ({
        color: outcome.color,
        iconURI: outcome.badge.image4x,
        name: outcome.title,
      })),
      title: title,
      deadlineTimeMS: deadlineTimeMS,
    };
    return predictionSettings;
  });
  return predictionSettings[0];
}

let exampleGraphqlResponse = {
  "data": {
    "community": {
      "id": "918644311",
      "channel": {
        "id": "918644311",
        "activePredictionEvents": [
          {
            "id": "08bf17c1-912c-4867-a14b-6c9d0425a3dc",
            "createdAt": "2023-07-15T22:09:50.385041417Z",
            "outcomes": [
              {
                "id": "58499226-d650-4d49-8f23-5d7a391ad21d",
                "color": "BLUE",
                "title": "y",
                "totalPoints": 0,
                "badge": {
                  "image4x":
                    "https://static-cdn.jtvnw.net/badges/v1/e33d8b46-f63b-4e67-996d-4a7dcec0ad33/3",
                },
              },
              {
                "id": "a6737208-c3cc-454b-8f9a-5d8055ac5c2c",
                "color": "PINK",
                "title": "n",
                "totalPoints": 0,
                "badge": {
                  "image4x":
                    "https://static-cdn.jtvnw.net/badges/v1/4b76d5f2-91cc-4400-adf2-908a1e6cfd1e/3",
                },
              },
            ],
            "predictionWindowSeconds": 1800,
            "status": "ACTIVE",
            "title": "uniquepredictionname",
            "winningOutcome": null,
          },
        ],
      },
    },
  },
};

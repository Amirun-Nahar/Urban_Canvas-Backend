const admin = require('firebase-admin');
require('dotenv').config();

// Firebase Admin SDK configuration
const serviceAccount = {
  type: "service_account",
  project_id: "urban-canvas-11ebd",
  private_key_id: "7f90f54a768796624382f29ff0a9b16cbc16d3a9",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDHQau5uVZvZcqw\ngpgKyS+9cve3f6a5hpTjZmEY+9ICld+O1KsNiMGjkMA8fJB3X7188RafQrGBZYws\nP8bckFT4AK5+HVlsih2Y7mDTsJdccHbmImd4R1Fil8tx5Nm8Bg0PBa6+r05HP+dF\nZE25fgINaNOpOy0B5SPvjt5BcNWM4pwLa8AnYqrP6pqAiodbRVynMptkmG8tJLFk\nQXxbeMcD+jhnp1zpP44bbFflLV+1egjnXM+C+A3zo1iaoq23tkL/FT3xLsXqFo8a\nICaQp3q7SB7N/OfIrl+kNgLzWx+h2MSvEMS/ODJjCd1dO/blVt+ShgGOG1bdkmXY\nWM4pXIO3AgMBAAECggEANNJicU5CLS7ZcDh2kOlrp/fZ1oHXE3ircKsb03EyZ7AO\nf0E+hUx7NN6zL3XAIH03cO9ClX6rKsfeRH61u5Phios3tsQWCDGHDhsnfQbj4UQJ\nKRH2xwp090ORUcSeufsKrDBP9knn4Ph+WUVxW1qdtatT7Rl8YXO6to9zuPpuCjYy\nLOpU0mQaz6l0uTAfBWb+19Mkt2R4p4RJPIGUQtGUe3L6cIKYjTY9BTWBJBibPqbu\nyAW2C8z7o2pYM77IwjpMtRHoBRoc6VO2uiCZqUO4+sl7IZd6H9YTisLRl0nwPQks\ndc+SkK85p2CTPKfjTVzmOROflPoeSa9VpBr0TmeY2QKBgQD9E36M+GI/9rnnPY28\nCg+fOCpAKHY491yDhdu60LXa/aSgWBryeTCt/3z2cOxpnxztvN5cxIGn4kN12tHo\nqxw2P2vzuU5leiewn5OAIWDaP2U9BXY/tabZyeHh3KxMugKsgYxU+I/1WN/AEszz\nalR58/QtddCa+De9k/CWzM67OQKBgQDJjv93y1PFUWFhGMJOvTXiOtk5wZntH84x\n2auU51J7QbeisTipH6T8Vb9xOf61EoXIhmHNXVXz9BigCOyAR8jMPYqcMmDaChb2\nYaCn+BfF6TETLJroH4WTcOTO0Ezi/yfnWJC+A/kT1sH+n6b0uhwBWPafGyXIJqpk\nMwpXIAYGbwKBgBM+AzZGwHmqkdICPR+aCDwL8jJ0oSCNtkwNxno62kjvVjAW4t2i\n10+ziFXYmjEhtvpgjOuyyUTxkD2KyMEPGZMKWXPrmAlhM1lbmMR6RTny7giovKf1\ncN1IW1NoCvW+guuI4hmn2JJIEqMxCsJLSGcJZHx8Y8MUsnBIqldc9S8JAoGBAJzf\nJefXoVBegVrvyTM9QjXcNXslOib67SGRV2CiFWkHAeSm6AGBNoiKOGDokVvema8z\nH+WVMjOXlJ7hsyg4Noj3kOz2rLimx65k14RDrEUFtING4R2uguj5IavxJRY7HpSJ\nMsYhE3ekWwJQwcGRJADMe83jdCluJomry+15aBcTAoGAcIHKXv3VM/0bABqXNo8+\nXShV0ERgw/wtj4shSHamFSG2g1IXFZuCd3QjzAkZ5gu1FcxjYQu0fR2l8Q0F/ngV\ne2tTC4bIHFSsX3HcKS32IW1LnD8QOYUgygUMg9OEkhakNvMlu1dY+wbfHqlDucRj\nYcPF+ynMt/yiPP9CxUcHyOY=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@urban-canvas-11ebd.iam.gserviceaccount.com",
  client_id: "104667433418961427838",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40urban-canvas-11ebd.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://urban-canvas-11ebd-default-rtdb.firebaseio.com"
});

console.log('Firebase Admin SDK initialized successfully');

module.exports = admin; 
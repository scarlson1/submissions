"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRequests = exports.beforeCreate = exports.beforeSignIn = exports.newSubmissionNotifications = exports.sendContactEmail = exports.getPropertyDetails = void 0;
require("firebase-functions");
const app_1 = require("firebase-admin/app");
(0, app_1.initializeApp)();
var callables_1 = require("./callables");
Object.defineProperty(exports, "getPropertyDetails", { enumerable: true, get: function () { return callables_1.getPropertyDetails; } });
Object.defineProperty(exports, "sendContactEmail", { enumerable: true, get: function () { return callables_1.sendContactEmail; } });
var firestoreEvents_1 = require("./firestoreEvents");
Object.defineProperty(exports, "newSubmissionNotifications", { enumerable: true, get: function () { return firestoreEvents_1.newSubmissionNotifications; } });
var authEvents_1 = require("./authEvents");
Object.defineProperty(exports, "beforeSignIn", { enumerable: true, get: function () { return authEvents_1.beforeSignIn; } });
Object.defineProperty(exports, "beforeCreate", { enumerable: true, get: function () { return authEvents_1.beforeCreate; } });
var routes_1 = require("./routes");
Object.defineProperty(exports, "authRequests", { enumerable: true, get: function () { return routes_1.authRequests; } });
//# sourceMappingURL=index.js.map
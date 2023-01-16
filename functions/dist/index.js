"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newSubmissionNotifications = exports.getPropertyDetails = void 0;
require("firebase-functions");
const app_1 = require("firebase-admin/app");
(0, app_1.initializeApp)();
var Callables_1 = require("./Callables");
Object.defineProperty(exports, "getPropertyDetails", { enumerable: true, get: function () { return Callables_1.getPropertyDetails; } });
var firestoreEvents_1 = require("./firestoreEvents");
Object.defineProperty(exports, "newSubmissionNotifications", { enumerable: true, get: function () { return firestoreEvents_1.newSubmissionNotifications; } });
//# sourceMappingURL=index.js.map
var cron = require('node-cron');
var schema = new Schema({
    missionId: String,
    DFMSubscription: {
        type: Schema.Types.ObjectId,
        ref: 'DFMSubscription'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    description: String,
    files: [{
        file: String,
        status: {
            type: String,
            default: 'Proceesing'
        }
    }],
    fileUploadStatus: {
        type: String,
        default: ''
    },
    status: String,
    others: [{
        serviceId: {
            type: Schema.Types.ObjectId,
            ref: 'ServiceList'
        },
        name: String, //orthomosaic,mapViewer,DVI,DSM,threedMode,KMZ
        file: String,
        data: Schema.Types.Mixed,
        status: {
            type: String
        }
    }]
});

schema.plugin(deepPopulate, {});
schema.plugin(uniqueValidator);
schema.plugin(timestamps);
module.exports = mongoose.model('Mission', schema);

var exports = _.cloneDeep(require("sails-wohlig-service")(schema, "serviceId user DFMSubscription", "serviceId user DFMSubscriptions"));
var model = {
    findMe: function (data, callback) {
        this.getOne({
            "_id": data._id
        }, function (err, dataF) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, dataF);
            }
        });
    },
    getByUser: function (data, callback) {
        this.find({
            "user": data.user
        }, function (err, dataF) {
            if (err) {
                callback(err, null);
            } else {
                if (dataF) {
                    callback(null, dataF);
                } else {
                    callback({
                        message: "Something went wrong!"
                    }, null);
                }
            }
        });
    },
};
// cron.schedule('1 * * * * *', function () {
//     Mission.find({}, function (err, found) {
//         if (err) {
//             callback(err, null);
//         } else {
//             _.forEach(found, function (value) {
//             // write their api to update status if changed
//             value.status="checked";
//             value.save(function(){})
//             });
//             console.log("m in found");
//         }
//     });
// });

module.exports = _.assign(module.exports, exports, model);
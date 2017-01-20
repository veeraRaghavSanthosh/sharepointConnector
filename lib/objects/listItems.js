var async = require('async'),
    _ = require('underscore');
module.exports = function(client) {
    var doRequest = require('../util/doRequest')(client),
        urlBuilder = require('../util/urlBuilderTools'),
        conveniences,
        crudl = {
            list: function(listId, cb) {
                var host = client.BASE_LIST_URL + "/getByTitle('" + listId + "')" + "/Items";
                host = urlBuilder.augmentURL(host, false, client.filterFields, client.selectFields, client.expandFields, client.orOperator, client.andOrOperator, client.$top);
                return doRequest(host, function(err, items, next) {
                    if (err) {
                        return cb(err);
                    }
                    items = conveniences('ListItems', items, listId);
                    return cb(null, items, next);
                });
            },
            listAll: function(listId, cb) {
                var host = client.BASE_LIST_URL + "/getByTitle('" + listId + "')" + "/Items";
                host = urlBuilder.augmentURL(host, false, client.filterFields, client.selectFields, client.expandFields, client.orOperator, client.andOrOperator, client.$top);
                var urlObj = {
                    host: host,
                    type: 'pagination'
                };
                var result = [];
                var urlCheck = "true";
                async.whilst(
                    function() {
                        return urlCheck;
                    },
                    function(callback) {
                        doRequest(urlObj, function(err, nextItems) {
                            if (err) {
                                return callback(err);
                            }
                            urlCheck = nextItems["d"]["__next"] ? true : false;
                            urlObj.host = nextItems["d"]["__next"];
                            if (nextItems["d"]["__next"]) {
                                urlObj.host = urlObj.host.substring(urlObj.host.indexOf("/sites/"));
                            }
                            result = result.concat(nextItems.d.results);
                            callback();
                        });
                    },
                    function(err) {
                        if (err) {
                            return cb(err);
                        }
                        return cb(null, result);
                    }
                );
            },
            currentuser: function(filter, cb) {
                var host = client.BASE_LIST_URL.substring(0, client.BASE_LIST_URL.indexOf('_api/')) + "_api/web/currentuser?$filter=" + filter;
                return doRequest(host, function(err, response) {
                    if (err) {
                        return cb(err);
                    }
                    return cb(null, response);
                });
            },
            byteStream: function(floderName, filename, cb) {
                var host = client.BASE_LIST_URL.substring(0, client.BASE_LIST_URL.indexOf('_api/')) + "/_api/web/GetFolderByServerRelativeUrl('" + floderName + "')/Files('" + filename + "')/openbinarystream";
                return doRequest(host, function(err, items) {
                    if (err) {
                        return cb(err);
                    }
                    return cb(null, items);
                });
            },
            byteStreamByFilePath: function(filePath, cb) {
                var host = client.BASE_LIST_URL.substring(0, client.BASE_LIST_URL.indexOf('_api/')) + "_api/Web/getfilebyserverrelativeurl('" + filePath + "')/$value";
                return doRequest(host, function(err, items) {
                    if (err) {
                        return cb(err);
                    }
                    return cb(null, items);
                });
            },
            read: function(listId, itemId, cb) {
                if (!listId || !itemId) {
                    return cb('Error reading - unspecified listId or itemId');
                }
                var host = client.BASE_LIST_URL + "/getByTitle('" + listId + "')" + "/Items(" + itemId + ")",
                    fileHost = host + '/File';
                host = urlBuilder.augmentURL(host, client.fieldValuesAsText, null, client.selectFields, client.expandFields, client.orOperator, client.andOrOperator, false);
                async.parallel({
                    item: async.apply(doRequest, host),
                    file: async.apply(doRequest, fileHost)
                }, function(err, response) {
                    if (err) {
                        return cb(err);
                    }
                    var item = response.item;
                    item.File = response.File;
                    item = conveniences('ListItem', item, listId);
                    return cb(null, item);
                });
            },
            create: function(listId, listItem, cb) {
                if (!listId || !listItem) {
                    return cb('No list or listItem specifided');
                }
                var host = client.BASE_LIST_URL + "/getByTitle('" + listId + "')" + "/Items";
                listItem = _.extend({
                    "__metadata": {
                        "type": "SP.List"
                    }
                }, listItem);
                return doRequest({
                    url: host,
                    method: 'POST',
                    json: listItem,
                    headers: {
                        'X-RequestDigest': client.baseContext,
                        'IF-MATCH': '*',
                        'X-HTTP-Method': 'POST'
                    }
                }, function(err, createResult) {
                    if (err) {
                        return cb(err);
                    }
                    createResult = conveniences('ListItem', createResult, listId);
                    return cb(null, createResult);
                });
            },
            moveTo: function(oldFilePath, newFilePath, cb) {
                if (!oldFilePath || !newFilePath) {
                    return cb('No new File Path or new File Path specifided');
                }
                doRequest({
                    url: client.BASE_LIST_URL.substring(0, client.BASE_LIST_URL.indexOf('_api/')) + '_api/contextinfo',
                    method: 'POST',
                    headers: {
                        'IF-MATCH': '*',
                        'content-Type': 'application/json;odata=verbose'
                    }
                }, function(err, digestToekn) {
                    if (err) {
                        return cb(err);
                    } else {
                        console.log("digestToekn", digestToekn);
                        var host = client.BASE_LIST_URL.substring(0, client.BASE_LIST_URL.indexOf('_api/')) + "_api/web/getfilebyserverrelativeurl('" + oldFilePath + "')/moveto(newurl='" + newFilePath + "',flags=1)";
                        console.log("host", host);
                        return doRequest({
                            url: host,
                            method: 'POST',
                            headers: {
                                'X-RequestDigest': digestToekn.GetContextWebInformation ? digestToekn.GetContextWebInformation.FormDigestValue : "",
                                'IF-MATCH': '*',
                                'content-Type': 'application/json;odata=verbose',
                                'X-HTTP-Method': 'MERGE'
                            }
                        }, function(err, updateResult) {
                            if (err) {
                                return cb(err);
                            }
                            return cb(null, {
                                "status": "Updated successfully",
                                "msg": updateResult
                            });
                        });
                    }
                });
            },
            update: function(listId, listItem, cb) {
                if (!listId || !listItem) {
                    return cb('No list or listItem specifided');
                }
                doRequest({
                    url: client.BASE_LIST_URL.substring(0, client.BASE_LIST_URL.indexOf('_api/')) + '_api/contextinfo',
                    method: 'POST',
                    json: listItem,
                    headers: {
                        // 'X-RequestDigest': client.baseContext,
                        'IF-MATCH': '*',
                        'content-Type': 'application/json;odata=verbose'
                        // 'X-HTTP-Method': 'MERGE'
                    }
                }, function(err, digestToekn) {
                    if (err) {
                        return cb(err);
                    } else {
                        var host = client.BASE_LIST_URL + "/getByTitle('" + listId + "')" + "/Items(" + listItem.itemId + ")";
                        listItem = _.extend({
                            "__metadata": {
                                "type": "SP.FieldStringValues"
                            }
                        }, listItem);
                        return doRequest({
                            url: host,
                            method: 'POST',
                            json: listItem,
                            headers: {
                                'X-RequestDigest': digestToekn.GetContextWebInformation ? digestToekn.GetContextWebInformation.FormDigestValue : "",
                                'IF-MATCH': '*',
                                'content-Type': 'application/json;odata=verbose',
                                'X-HTTP-Method': 'MERGE'
                            }
                        }, function(err, updateResult) {
                            if (err) {
                                return cb(err);
                            }
                            return cb(null, {
                                "status": " Updated successfully",
                                "msg": updateResult
                            });
                        });
                    }
                });
            },
            del: function(listId, itemId, cb) {
                if (!listId || !itemId) {
                    return cb('Error deleting - unspecified listId or itemId');
                }
                var host = client.BASE_LIST_URL + "/getByTitle('" + listId + "')" + "/Items(" + itemId + ")";
                return doRequest({
                    url: host,
                    method: 'POST',
                    headers: {
                        'X-RequestDigest': client.baseContext,
                        'IF-MATCH': '*',
                        'X-HTTP-Method': 'DELETE'
                    }
                }, function(err, createResult) {
                    if (err) {
                        return cb(err);
                    }
                    return cb(null, createResult);
                });
            }
        };
    crudl['delete'] = crudl.del;
    conveniences = require('../util/conveniences')(crudl);
    return crudl;
};

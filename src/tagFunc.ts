import {createTag} from "./tag/createTag";
import {authDecorator} from "./authDecorator";
import {getAllTags} from "./tag/getAllTags";
import {deleteTag} from "./tag/deleteTag";

exports.createTag = authDecorator(createTag, ["ADMIN"]);
exports.deleteTag = authDecorator(deleteTag, ["ADMIN"]);
exports.getAllTags = authDecorator(getAllTags, ["ADMIN", "BOOKER"]);

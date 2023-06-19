import {authDecorator} from "./authDecorator";
import {saveGroup} from "./group/saveGroup";
import {deleteGroup} from "./group/deleteGroup";
import {getAllGroups} from "./group/getAllGroups";

exports.saveGroup = authDecorator(saveGroup, ["ADMIN"]);
exports.deleteGroup = authDecorator(deleteGroup, ["ADMIN"]);
exports.getAllGroups = authDecorator(getAllGroups, ["ADMIN", "BOOKER"]);

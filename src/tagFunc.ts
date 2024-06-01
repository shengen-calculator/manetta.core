import {authDecorator} from "./authDecorator";
import {getAllTags} from "./tag/getAllTags";

exports.getAllTags = authDecorator(getAllTags, ["ADMIN", "BOOKER"]);

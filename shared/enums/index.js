"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipmentStatus = exports.RentalStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["STAFF"] = "staff";
    UserRole["CUSTOMER"] = "customer";
})(UserRole || (exports.UserRole = UserRole = {}));
var RentalStatus;
(function (RentalStatus) {
    RentalStatus["PENDING"] = "pending";
    RentalStatus["ACTIVE"] = "active";
    RentalStatus["RETURNED"] = "returned";
    RentalStatus["OVERDUE"] = "overdue";
    RentalStatus["CANCELLED"] = "cancelled";
})(RentalStatus || (exports.RentalStatus = RentalStatus = {}));
var EquipmentStatus;
(function (EquipmentStatus) {
    EquipmentStatus["AVAILABLE"] = "available";
    EquipmentStatus["RENTED"] = "rented";
    EquipmentStatus["MAINTENANCE"] = "maintenance";
    EquipmentStatus["RETIRED"] = "retired";
})(EquipmentStatus || (exports.EquipmentStatus = EquipmentStatus = {}));
//# sourceMappingURL=index.js.map
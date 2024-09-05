// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Provenance {
    address public admin;
    mapping(address => Entity) public entities;
    mapping(string => string) public productCIDs; // Mapping to store product IPFS CIDs
    mapping(string => string) public shipmentCIDs; // Mapping to store shipment IPFS CIDs
    mapping(string => address) public shipmentOwners; // Mapping to keep track of current shipment owner

    mapping(address => string[]) public ownedShipments; //mapping to keep track of all shipments owned by an address
    // Mapping to keep track of each shipment's index in the ownedShipments array
    mapping(string => uint) private shipmentIndexes;
    // Mapping to track pending transfers for each address
    mapping(address => string[]) private pendingTransfers;
    // Mapping to track the index of each pending transfer in the pendingTransfers array
    mapping(string => mapping(address => uint)) private pendingTransferIndexes;

    mapping(string => TemperatureLog[]) public temperatureLogs; // Mapping from shipment serial numbers to temperature logs
    mapping(string => string[]) public shipmentToProducts; // Mapping from shipment serial numbers to arrays of product serial numbers
    // Mapping to track whether a serial number is pending for transfer
    mapping(string => bool) private pendingSerialNumbers;
    //mapping to store alert for a shipment
    mapping(string => AlertLog[]) public alerts;

    string[] public productSerialNumbers;
    string[] public shipmentSerialNumbers;
    address[] public registeredEntityAddresses;

    enum Role {
        Supplier,
        Producer,
        Transporter,
        Warehouse,
        Market
    }

    enum AlertCode {
        TemperatureAlert,
        LocationAlert,
        ShockAlert,
        HumidityAlert
    }

    struct Entity {
        address entityAddress;
        Role role;
        string name;
        string location;
        bool isRegistered;
        bool isCertified;
        string link;
    }

    struct TemperatureLog {
        uint256 timestamp;
        int temperature;
    }

    struct AlertLog {
        uint256 timestamp;
        uint256 code;
    }

    event EntityRegistered(
        address indexed entityAddress,
        Role role,
        string name,
        bool certified,
        string link
    );
    event EntityCertified(address indexed entityAddress, bool certified);

    event Alert(string serialNo, string message);

    event ProductAdded(
        string serialNo,
        string ipfsCid,
        uint timeStamp,
        address indexed producer
    );
    event ProductCreatedFromExisting(
        string newSerialNo,
        string[] parentSerialNos,
        string ipfsCid,
        uint timeStamp,
        address indexed producer
    );

    event ShipmentAdded(
        string serialNo,
        string ipfsCid,
        uint timeStamp,
        address indexed sender
    );
    event ProductsAssociatedToShipment(
        string shipmentSerialNo,
        string[] productSerialNos,
        string newIpfsCid,
        uint timestamp
    );
    event ShipmentOwnershipTransferred(
        string serialNo,
        address from,
        address to
    );
    event TemperatureLogged(string serialNo, int temperature, uint timeStamp);
    event ShipmentTransferInitiated(
        string serialNo,
        address from,
        address to,
        uint256 timestamp
    );

    event ShipmentTransferAccepted(
        string serialNo,
        address newOwner,
        uint256 timestamp
    );

    event ShipmentOwnershipTransferred(
        string serialNo,
        address from,
        address to,
        uint256 timestamp
    );

    event ShipmentTransferRejected(
        string serialNo,
        address rejector,
        uint256 timestamp
    );

    event ShipmentUpdated(
        string serialNo,
        string newIpfsCid,
        int temperature,
        string location,
        address updatedBy,
        uint timestamp
    );

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyRegistered() {
        require(entities[msg.sender].isRegistered, "Entity is not registered");
        _;
    }

    modifier onlyOwnerOfShipment(string memory serialNo) {
        require(
            msg.sender == shipmentOwners[serialNo],
            "Only the shipment's owner can perform this action"
        );
        _;
    }

    modifier onlyOwnerOrAdmin(string memory serialNo) {
        require(
            msg.sender == shipmentOwners[serialNo] || msg.sender == admin,
            "Only the shipment's owner or admin can perform this action"
        );
        _;
    }

    modifier onlyCertified() {
        require(entities[msg.sender].isCertified, "Entity must be certified");
        _;
    }

    // Entity management functions
    function registerEntity(
        address entity,
        Role role,
        string memory name,
        string memory location,
        bool certified,
        string memory link
    ) public onlyAdmin {
        require(!entities[entity].isRegistered, "Entity already registered");
        entities[entity] = Entity(
            entity,
            role,
            name,
            location,
            true,
            certified,
            link
        );
        registeredEntityAddresses.push(entity);
        emit EntityRegistered(entity, role, name, certified, link);
    }

    function getEntityDetails(
        address entity
    ) public view returns (Entity memory) {
        return entities[entity];
    }

    // Function to get all registered entities
    function getAllRegisteredEntities() public view returns (address[] memory) {
        return registeredEntityAddresses;
    }

    function createAlert(
        string memory serialNo,
        string memory message
    ) public onlyRegistered {
        require(
            bytes(shipmentCIDs[serialNo]).length != 0,
            "Shipment does not exist"
        );
        emit Alert(serialNo, message);
    }

    function certifyEntity(address entity, bool certified) public onlyAdmin {
        require(
            entities[entity].isRegistered,
            "Entity must be registered first"
        );
        entities[entity].isCertified = certified;
        emit EntityCertified(entity, certified);
    }

    // Product management functions

    function getAllProductSerialNumbers()
        public
        view
        returns (string[] memory)
    {
        return productSerialNumbers;
    }

    // Function to get a product's CID by its serial number
    function getProductCID(
        string memory serialNo
    ) public view returns (string memory) {
        require(
            bytes(productCIDs[serialNo]).length != 0,
            "Product does not exist"
        );
        return productCIDs[serialNo];
    }

    // Function to get a shipment's CID by its serial number
    function getShipmentCID(
        string memory serialNo
    ) public view returns (string memory) {
        require(
            bytes(shipmentCIDs[serialNo]).length != 0,
            "Shipment does not exist!"
        );
        return shipmentCIDs[serialNo];
    }

    function addProduct(
        string memory serialNo,
        string memory ipfsCid
    ) public onlyRegistered {
        require(bytes(serialNo).length > 0, "Serial number cannot be empty!");
        require(
            bytes(productCIDs[serialNo]).length == 0,
            "Product already exists!"
        );
        require(entities[msg.sender].isCertified, "Entity must be certified!");

        productCIDs[serialNo] = ipfsCid;
        productSerialNumbers.push(serialNo);
        emit ProductAdded(serialNo, ipfsCid, block.timestamp, msg.sender);
    }

    function createProductFromExisting(
        string memory newSerialNo,
        string[] memory parentSerialNos,
        string memory ipfsCid
    ) public onlyRegistered {
        require(
            bytes(newSerialNo).length > 0,
            "Serial number cannot be empty!"
        );
        require(
            bytes(productCIDs[newSerialNo]).length == 0,
            "New product serial number already exists"
        );
        require(entities[msg.sender].isCertified, "Entity must be certified!");
        // Ensure all parent serial numbers exist
        for (uint i = 0; i < parentSerialNos.length; i++) {
            require(
                bytes(productCIDs[parentSerialNos[i]]).length > 0,
                "Parent product does not exist"
            );
        }

        productCIDs[newSerialNo] = ipfsCid;
        productSerialNumbers.push(newSerialNo);
        emit ProductCreatedFromExisting(
            newSerialNo,
            parentSerialNos,
            ipfsCid,
            block.timestamp,
            msg.sender
        );
    }

    // Shipment management functions
    function addShipment(
        string memory serialNo,
        string memory ipfsCid,
        address owner
    ) public onlyRegistered {
        require(bytes(serialNo).length > 0, "Serial number cannot be empty");
        require(
            bytes(shipmentCIDs[serialNo]).length == 0,
            "Shipment already exists"
        );
        require(entities[msg.sender].isCertified, "Entity must be certified!");
        //require for ipfs not to be empty
        require(bytes(ipfsCid).length > 0, "Invalid IPFS CID!");

        shipmentCIDs[serialNo] = ipfsCid;
        shipmentOwners[serialNo] = owner;
        shipmentSerialNumbers.push(serialNo);
        ownedShipments[owner].push(serialNo);
        shipmentIndexes[serialNo] = ownedShipments[msg.sender].length - 1;
        emit ShipmentAdded(serialNo, ipfsCid, block.timestamp, msg.sender);
    }

    function getSender() public view returns (address) {
        return msg.sender;
    }
    function associateProductsToShipment(
        string memory shipmentSerialNo,
        string[] memory productSerialNos,
        string memory newIpfsCid
    ) public onlyOwnerOrAdmin(shipmentSerialNo) {
        require(
            bytes(shipmentCIDs[shipmentSerialNo]).length != 0,
            "Shipment does not exist"
        );

        require(bytes(newIpfsCid).length > 0, "Invalid IPFS CID");

        // Update the shipment's CID to the new CID provided
        delete shipmentCIDs[shipmentSerialNo];
        shipmentCIDs[shipmentSerialNo] = newIpfsCid;

        // Associating products to the shipment
        for (uint i = 0; i < productSerialNos.length; i++) {
            require(
                bytes(productCIDs[productSerialNos[i]]).length != 0,
                "Product does not exist"
            );
            shipmentToProducts[shipmentSerialNo].push(productSerialNos[i]);
        }

        // Emitting the event with the new CID
        emit ProductsAssociatedToShipment(
            shipmentSerialNo,
            productSerialNos,
            newIpfsCid,
            block.timestamp
        );
    }

    //function to update shipment CID only

    function updateShipmentCID(
        string memory serialNo,
        string memory newIpfsCid
    ) public onlyOwnerOrAdmin(serialNo) {
        require(bytes(newIpfsCid).length > 0, "Invalid IPFS CID");

        // Update the shipment's CID
        delete shipmentCIDs[serialNo];
        shipmentCIDs[serialNo] = newIpfsCid;

        // Emit an event with the new information and the address of the updater
        emit ShipmentUpdated(
            serialNo,
            newIpfsCid,
            0,
            "",
            msg.sender,
            block.timestamp
        );
    }

    function syncShipmentCID(
        string memory serialNo,
        string memory newIpfsCid,
        int temperature,
        string memory location
    ) public {
        require(
            msg.sender == shipmentOwners[serialNo],
            "Only the shipment's owner can update the CID"
        );
        require(bytes(newIpfsCid).length > 0, "Invalid IPFS CID");

        // Update the shipment's CID
        delete shipmentCIDs[serialNo];
        shipmentCIDs[serialNo] = newIpfsCid;

        // Log the temperature and location update

        ///se sterge
        temperatureLogs[serialNo].push(
            TemperatureLog(block.timestamp, temperature)
        );

        // Emit an event with the new information and the address of the updater
        emit ShipmentUpdated(
            serialNo,
            newIpfsCid,
            temperature,
            location,
            msg.sender,
            block.timestamp
        );
    }

    //function to return temperature logs for a shipment

    function getTemperatureLogs(
        string memory serialNo
    ) public view returns (TemperatureLog[] memory) {
        return temperatureLogs[serialNo];
    }

    function initiateShipmentTransfer(
        string memory serialNo,
        address newOwner
    ) public {
        require(
            entities[newOwner].isRegistered,
            "New owner must be a registered entity"
        );
        require(
            shipmentOwners[serialNo] == msg.sender,
            "Only the shipment's owner can initiate the transfer"
        );

        // Check if the serial number is already pending for transfer
        require(
            !pendingSerialNumbers[serialNo],
            "This shipment transfer is already pending"
        );

        pendingTransfers[newOwner].push(serialNo);
        pendingTransferIndexes[serialNo][newOwner] =
            pendingTransfers[newOwner].length -
            1;
        pendingSerialNumbers[serialNo] = true;

        emit ShipmentTransferInitiated(
            serialNo,
            msg.sender,
            newOwner,
            block.timestamp
        );
    }

    function acceptShipmentTransfer(
        string memory serialNo,
        string memory newIpfsCid // address own
    ) public {
        // require(
        //     hasPendingTransfer(msg.sender, serialNo),
        //     "No pending transfer for this shipment to you"
        // );
        require(bytes(newIpfsCid).length > 0, "Invalid IPFS CID");

        address previousOwner = shipmentOwners[serialNo];

        delete shipmentCIDs[serialNo];
        shipmentCIDs[serialNo] = newIpfsCid;

        delete shipmentOwners[serialNo];
        shipmentOwners[serialNo] = msg.sender;

        // Update the ownedShipments mapping
        uint indexToDelete = shipmentIndexes[serialNo];
        string[] storage previousOwnerShipments = ownedShipments[previousOwner];
        uint lastIndex = previousOwnerShipments.length - 1;

        if (indexToDelete != lastIndex) {
            string memory lastShipmentId = previousOwnerShipments[lastIndex];
            previousOwnerShipments[indexToDelete] = lastShipmentId;
            shipmentIndexes[lastShipmentId] = indexToDelete;
        }
        previousOwnerShipments.pop();
        delete shipmentIndexes[serialNo];

        ownedShipments[msg.sender].push(serialNo);
        shipmentIndexes[serialNo] = ownedShipments[msg.sender].length - 1;

        removePendingTransfer(msg.sender, serialNo);
        emit ShipmentTransferAccepted(serialNo, msg.sender, block.timestamp);
        emit ShipmentOwnershipTransferred(
            serialNo,
            previousOwner,
            msg.sender,
            block.timestamp
        );
    }

    // Function to reject a shipment transfer
    function rejectShipmentTransfer(
        string memory serialNo,
        string memory newIpfsCid
    ) public {
        require(bytes(newIpfsCid).length > 0, "Invalid IPFS CID");
        // require(hasPendingTransfer(msg.sender, serialNo), "No pending transfer for this shipment to you");

        // Update the IPFS CID
        shipmentCIDs[serialNo] = newIpfsCid;

        // Remove the shipment from the pending transfers
        removePendingTransfer(msg.sender, serialNo);

        // Emit event
        emit ShipmentTransferRejected(serialNo, msg.sender, block.timestamp);
    }

    //function to return all shipments owned by an address
    function getOwnedShipments(
        address owner
    ) public view returns (string[] memory) {
        return ownedShipments[owner];
    }

    // Function to get all shipment serial numbers
    function getAllShipmentSerialNumbers()
        public
        view
        returns (string[] memory)
    {
        return shipmentSerialNumbers;
    }

    // Helper function to check if an address has a pending transfer for a specific shipment
    // function hasPendingTransfer(
    //     address recipient,
    //     string memory serialNo
    // ) private view returns (bool) {
    //     string[] memory pending = pendingTransfers[recipient];
    //     for (uint i = 0; i < pending.length; i++) {
    //         if (keccak256(bytes(pending[i])) == keccak256(bytes(serialNo))) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }

    // Helper function to remove a shipment from the pending transfers list
    function removePendingTransfer(
        address recipient,
        string memory serialNo
    ) private {
        uint indexToDelete = pendingTransferIndexes[serialNo][recipient];
        string[] storage pending = pendingTransfers[recipient];
        uint lastIndex = pending.length - 1;

        if (indexToDelete != lastIndex) {
            string memory lastSerialNo = pending[lastIndex];
            pending[indexToDelete] = lastSerialNo;
            pendingTransferIndexes[lastSerialNo][recipient] = indexToDelete;
        }
        pending.pop();
        delete pendingTransferIndexes[serialNo][recipient];
        delete pendingSerialNumbers[serialNo];
    }

    // Function to get all pending transfers for a user
    function getPendingTransfers(
        address user
    ) public view returns (string[] memory) {
        return pendingTransfers[user];
    }

    // Temperature logging functions
    function logTemperature(
        string memory serialNo,
        int temperature
    ) public onlyOwnerOrAdmin(serialNo) {
        temperatureLogs[serialNo].push(
            TemperatureLog(block.timestamp, temperature)
        );
        emit TemperatureLogged(serialNo, temperature, block.timestamp);
    }

    //function to log array of temperatures for a shipment
    // function logTemperatureArray(
    //     string memory serialNo,
    //     int[] memory temperatures
    // ) public onlyOwnerOrAdmin(serialNo) {
    //     for (uint i = 0; i < temperatures.length; i++) {
    //         temperatureLogs[serialNo].push(
    //             TemperatureLog(block.timestamp, temperatures[i])
    //         );
    //     }
    // }

    //function to set alert for a shipment
    function setAlert(
        string memory serialNo,
        uint code
    ) public onlyOwnerOrAdmin(serialNo) {
        alerts[serialNo].push(AlertLog(block.timestamp, code));
    }

    //function to ger alerts for a shipment
    function getAlerts(
        string memory serialNo
    ) public view returns (AlertLog[] memory) {
        return alerts[serialNo];
    }
    // Accessor methods
    function getShipmentOwner(
        string memory serialNo
    ) public view returns (address) {
        require(
            bytes(shipmentCIDs[serialNo]).length != 0,
            "Shipment does not exist"
        );
        return shipmentOwners[serialNo];
    }

    function isAdmin(address user) public view returns (bool) {
        return user == admin;
    }
}

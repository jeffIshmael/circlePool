/**
 * @title CirclePool - this smart contract manages circles on Hedera
 * @author Jeff Muchiri
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CirclePool {
    uint public totalCircles;
    uint public totalPayments;

    address public aiAgent;
    address public owner;
    
    constructor() {
        owner = msg.sender;
        aiAgent = msg.sender;
    }

    struct Circle {
        uint circleId;
        uint amount;
        uint startDate;
        uint payDate;
        uint duration;
        uint maxMembers;
        uint cycle; //disbursements
        uint round; // whole rotation(everyone has gotten)
        uint interestPercent; // After a micro-loan a member returns with this interestPercent
        uint leftPercent; // the percentage left for the circle after a payout
        address admin; 
        uint loanableAmount;      
        address[] members;
        address[] payoutOrder;//order on how the payment is done
        mapping(address => uint) balances;
        mapping(address => bool) hasSent;
        mapping(address => uint) userLoan;

    }

    Circle[] public circles;

    //Records of withdrawals - payments
    struct Payment {
        uint id;
        uint circleId;
        address receiver;
        uint amount;
        uint timestamp;
    }

    Payment[] public payments;

    event CircleRegistered(uint indexed id,  uint amount, uint duration, uint maxMembers, uint startDate,uint interestPercent, uint leftPercent,  address indexed admin);
    event CashDeposited(uint indexed circleId, address indexed receiver, uint amount);
    event FundsDisbursed(uint indexed circleId, address indexed recipient, uint amount);
    event RefundIssued(uint indexed circleId, address indexed member, uint amount);
    event amountWithdrawn( address indexed _address, uint amount);
    event MemberAdded(uint indexed _circleId , address indexed   _address);
    event PayoutOrderSet(uint indexed _circleId, address [] indexed _payoutOrder);
    event MemberRemoved(uint indexed _circleId, address indexed _member);
    event CircleDeleted(uint indexed _circleId);
    event PayOutProcessed( address indexed _receiver, uint _amount);
    event WithdrawalRecorded(uint indexed _circleId, address indexed _receiver, uint  _amount);
    event RefundUpdated( uint indexed _circleId);
    event MemberAddedToPayoutOrder(uint indexed _circleId, address[] indexed _member);
    event aiAgentSet(address indexed _aiAgent);
    event PayDateChecked(uint indexed _circleId, bool _isPastPayDate, bool _isAllMembersContributed, bool isDisbursed);
    event TransferDone(address indexed _receiver, uint _amount, bool _success, uint _contractBal, uint _receiverBalBefore); 
    event PayoutDone(uint indexed _circleId, address indexed _receiver, uint _amount);
    event LoanPaid(uint indexed circleId, address indexed member, uint amount);    
    event LoanProcessed(uint indexed circleId, address indexed member, uint amount);            
   

    // Register a new circle
    function registerCircle(
        uint _amount, 
        uint _duration, 
        uint _startDate, 
        uint _maxMembers, 
        uint _percentageInterest,
        uint _percentageLeft) public {
        require(_startDate >= block.timestamp, "Start date must be in the future.");
        require(_duration > 0, "Duration must be greater than 0.");
        require(_amount > 0, "Amount must be greater than 0.");
        require(_maxMembers <= 15,"Maximum number of members is 15.");
        require(_percentageInterest >= 1, "Interest should be above 1%.");
        require(_percentageLeft >= 10, "The percentage being left should be at least 10%.");
        

        Circle storage newCircle = circles.push();
        newCircle.circleId = totalCircles;
        newCircle.amount = _amount;
        newCircle.startDate = _startDate;
        newCircle.duration = _duration;
        newCircle.maxMembers = _maxMembers;
        newCircle.payDate = _startDate + _duration * 24 * 60 * 60;
        newCircle.admin = msg.sender;
        newCircle.members.push(msg.sender);
        newCircle.cycle = 1;
        newCircle.round = 1;
        newCircle.interestPercent = _percentageInterest;
        newCircle.leftPercent = _percentageLeft;
        newCircle.balances[msg.sender] = 0;
        newCircle.hasSent[msg.sender] = false;


        totalCircles++;

        emit CircleRegistered(
            totalCircles - 1, 
            _amount,
            _maxMembers, 
            _duration, 
            _startDate, 
            _percentageInterest,
            _percentageLeft, 
            msg.sender
        );
    }
    
    // Add a member to the circle
    function addMember(address _address, uint _circleId) public onlyAdmin(_circleId) {
        require(_circleId < circles.length, "The circleId does not exist");
        require(!isMember(_circleId, _address), "The address is already a member.");
        Circle storage circle = circles[_circleId];
        require(circle.members.length < 15, "Circle already has max members.");
        circle.members.push(_address);
         if(block.timestamp < circle.startDate && circle.payoutOrder.length > 0){
            circle.payoutOrder.push(_address);
        }
        emit MemberAdded(_circleId, _address);
    }

    // Deposit cash to a circle using native HBAR
      function depositCash(uint _circleId) public payable onlyMembers(_circleId) {
        require(_circleId < totalCircles, "Circle does not exist");
        Circle storage circle = circles[_circleId];
        
        uint _amount = msg.value;
        require(_amount > 0, "Amount must be greater than 0");

        // Calculate actual deposit excluding 5% fee
        uint netAmount = (_amount * 100) / 105;

        // Update balance
        circle.balances[msg.sender] += netAmount;

        // Mark as paid if reached required amount
        if (circle.balances[msg.sender] >= circle.amount) {
            circle.hasSent[msg.sender] = true;
        }
        
        emit CashDeposited(_circleId, msg.sender, _amount);
    }

     // function to loan from the available loan
    function processLoan (address _member, uint _circleId, uint _amount) public onlyAiAgent{
        // validity checking
        require(_member != address(0), "Use a valid address.");
        require(_amount >0 ,"Enter a valid amount.");
        require(_circleId < totalCircles, "Circle does not exist");
        // require the address is a member
        require(isMember( _circleId, _member), "The address is not a member.");
         Circle storage circle = circles[_circleId];
        // require the address doesnt have a loan
        require(circle.userLoan[_member] == 0, "The member has a loan and needs to first repay.");
        // require the balance is there
        require (circle.loanableAmount >= _amount, "Amount higher than available to loan.");

        // Transfer HBAR to member
        (bool sent, ) = payable(_member).call{value: _amount}("");
        require(sent, "HBAR transfer failed");

        // updating states
        circle.userLoan[_member] = _amount + (_amount * circle.interestPercent) / 100;
        circle.loanableAmount -= _amount;

        emit LoanProcessed(_circleId, _member, _amount);        
    }

    // function to repay loan :- No restrictions to allow them to pay from any address
     function repayLoan (address _member, uint _circleId) public payable {
        // validity checking
        require(_member != address(0), "Use a valid address.");
        uint _amount = msg.value;
        require(_amount > 0, "Enter a valid amount.");
        require(_circleId < totalCircles, "Circle does not exist");
        // require the address is a member
        require(isMember( _circleId, _member), "The address is not a member.");
         Circle storage circle = circles[_circleId];
        // require the address doesnt have a loan
        require(circle.userLoan[_member] > 0, "The member has no loan yet.");

        // updating states
        require(_amount <= circle.userLoan[_member], "Amount exceeds outstanding loan");
        circle.userLoan[_member] -= _amount;
        circle.loanableAmount += _amount;

        emit LoanPaid(_circleId, _member, _amount);        
    }



    //function to add member to the payout order
    // check the aiAgent thing
    function addMemberToPayoutOrder(uint _circleId, address[] memory _member) public onlyAiAgent {
        
        Circle storage circle = circles[_circleId];
        // ensure its not in the middle of a round
        require(circle.round == 1, "Cannot add member to payout order during an active round");
        // ensure the member is a member of the circle
        for (uint i = 0; i < _member.length; i++) {
            require(isMember(_circleId, _member[i]), "Member is not a member of the circle");
        }
        // add the member to the payout order
        for (uint i = 0; i < _member.length; i++) {
            circle.payoutOrder.push(_member[i]);
        }
        emit MemberAddedToPayoutOrder(_circleId, _member);
    }

   // function to check if all contributed
   function _allMembersContributed(uint _circleId) private view returns (bool) {
    Circle storage circle = circles[_circleId];
    
    for (uint i = 0; i < circle.members.length; i++) {
        uint membersBalance = circle.balances[circle.members[i]];
        if (membersBalance < circle.amount) {
            return false;
        }
    }
    return true;
    }
    
    // internal check
    function allMembersContributed(uint _circleId) internal view returns (bool) {
    return _allMembersContributed(_circleId);
    }
    
    // public checking
    function checkAllMembersContributed(uint _circleId) public view returns (bool) {
        return _allMembersContributed(_circleId);
    }

    

    //function to process payout in native HBAR
    function processPayout(address _receiver, uint _amount) internal {
        (bool success, ) = payable(_receiver).call{value: _amount}("");
        emit TransferDone(_receiver, _amount, success, 0, 0);
        require(success, "Transfer failed");
        emit PayOutProcessed(_receiver, _amount);
    }

    //function to record all withdrawal function
    function recordWithdrawal(uint _circleId, address _receiver, uint _amount) internal {
         // Record the payment
        payments.push(Payment({
        id: totalPayments,
        circleId: _circleId,
        receiver: _receiver,
        amount: _amount,
        timestamp: block.timestamp
        }));

        totalPayments++;

        emit WithdrawalRecorded(_circleId, _receiver, _amount);
        
    }

    // Disburse funds to a member
    function disburse(uint _circleId) internal {
        Circle storage circle = circles[_circleId];        
        require(circle.payoutOrder.length > 0, "Payout order is empty");
        address recipient = circle.members[(circle.round - 1) % circle.payoutOrder.length];
        uint totalPay = circle.amount * circle.members.length;

        // Calculate total available funds: sum of all balances + sum of all lockedAmounts (for public circles)
        uint totalAvailable = 0;
        for (uint i = 0; i < circle.payoutOrder.length; i++) {
            address member = circle.payoutOrder[i];
            totalAvailable += circle.balances[member];
        }
        require(totalAvailable >= totalPay, "Not enough funds to disburse");


        // Now, all members have contributed their required amount
        // Proceed to transfer totalPay to recipient
        processPayout(recipient, totalPay);

        // Record the withdrawal
        recordWithdrawal(_circleId, recipient, totalPay);

        // Reset payment status for the next round and deduct balances
        for (uint i = 0; i < circle.payoutOrder.length; i++) {
            circle.hasSent[circle.payoutOrder[i]] = false;
            circle.balances[circle.payoutOrder[i]] -= circle.amount;
        }

        // Check if we have completed a rotation
        if (circle.round + 1 > circle.payoutOrder.length) {
            circle.cycle += 1; // Increment the round after one rotation
            circle.round = 1;
        }else{
            circle.round += 1;
        }
        circle.payDate += circle.duration * 24 * 60 * 60;

        emit FundsDisbursed(_circleId, recipient, totalPay);
    }

   

    // Function to delete a member (admin or self)
    function deleteMember(uint _circleId, address _member) public onlyMembers(_circleId) {
        Circle storage circle = circles[_circleId];
        require(msg.sender == circle.admin || msg.sender == _member, "Only admin or the member can delete");

        // Check if circle.cycle is divisible by members.length
        require(circle.members.length > 0, "No members to remove");
        require(circle.round == 1, "Cannot delete member during an active cycle");

        // Refund the member's balance if greater than zero
        uint refundAmount = circle.balances[_member];
        if (refundAmount > 0) {
            //transfer the money back to the member
            processPayout(_member, refundAmount);

            //record the withdrawal
            recordWithdrawal(_circleId, _member, refundAmount);
            circle.balances[_member] = 0; // Reset the balance
        }


        // Remove member from members array
        for (uint i = 0; i < circle.members.length; i++) {
            if (circle.members[i] == _member) {
                circle.members[i] = circle.members[circle.members.length - 1]; // Replace with the last member
                circle.members.pop(); // Remove the last member
                break;
            }
        }
        
        // Remove member from payout order 
        for (uint i = 0; i < circle.payoutOrder.length; i++) {
            if (circle.payoutOrder[i] == _member) {
                circle.payoutOrder[i] = circle.payoutOrder[circle.payoutOrder.length - 1];
                circle.payoutOrder.pop();
                break;
            }
        }

        emit MemberRemoved(_circleId, _member);
    }

    // Function to delete a circle (admin only) 
    // ensure that no one has a loan andd that the amount loanable is divided among members
    function deleteCircle(uint _circleId) public onlyAdmin(_circleId) {
        Circle storage circle = circles[_circleId];

         // ensure there is no active round
        require(circle.members.length > 0, "No members to remove");
        require(circle.round == 1, "Cannot delete member during an active cycle");

        // Refund all members
        refund(_circleId);

        // Remove the circle by swapping with the last element and then popping
        Circle storage lastCircle = circles[circles.length - 1];
        circles[_circleId].circleId = lastCircle.circleId;
        circles[_circleId].amount = lastCircle.amount;
        circles[_circleId].startDate = lastCircle.startDate;
        circles[_circleId].payDate = lastCircle.payDate;
        circles[_circleId].duration = lastCircle.duration;
        circles[_circleId].cycle = lastCircle.cycle;
        circles[_circleId].round = lastCircle.round;
        circles[_circleId].admin = lastCircle.admin;
        circles[_circleId].members = lastCircle.members;
        circles[_circleId].payoutOrder = lastCircle.payoutOrder;
        circles.pop();

        emit CircleDeleted(_circleId);
    }

   // Check pay date and trigger payout or refund
    function checkPayDate(uint[] memory circleIds) public onlyAiAgent {
        for (uint i = 0; i < circleIds.length; i++) {
            uint circleId = circleIds[i];
            require(circleId < totalCircles, "Circle does not exist");
            Circle storage circle = circles[circleId];
            bool isPastPayDate = block.timestamp >= circle.payDate;
            bool isAllMembersContributed = allMembersContributed(circleId);
            require(isPastPayDate, "Pay date has not passed");
            bool isDisbursed;
            // Check if the current time has passed the pay date
            if (isPastPayDate) {
                if (isAllMembersContributed) {
                    disburse(circleId); // Disburse funds if everyone has paid
                    isDisbursed = true;
                } else {
                    refund(circleId); // Refund if not everyone has paid
                    isDisbursed = false;
                }
            }
            emit PayDateChecked(circleId, isPastPayDate, isAllMembersContributed, isDisbursed);
        }
    }

   // Function to check the balance of a specific address in a specific circle
    function getBalance(uint _circleId, address _member) public view returns (uint[] memory) {
        require(_circleId < totalCircles, "Circle does not exist");
        
        Circle storage circle = circles[_circleId];
        
        // Create a fixed-size array with 2 elements
        uint [] memory balances = new uint[](2);
        
        // Assign the balance and locked amounts
        balances[0] = circle.balances[_member];
        balances[1] = circle.userLoan[_member];
        
        // Return the balance and user's loan
        return balances;
    }

    // function to get the balance of each member in a circle
   function getEachMemberBalance(uint _circleId) public view returns (address[] memory, uint[][] memory) {
    require(_circleId < totalCircles, "Circle does not exist.");    
    Circle storage circle = circles[_circleId];
    
    uint memberCount = circle.members.length;
    
    address[] memory memberAddresses = new address[](memberCount);
    uint[][] memory balances = new uint[][](memberCount);
    
    for (uint i = 0; i < memberCount; i++) {
        address member = circle.members[i];
        memberAddresses[i] = member;

        uint [] memory memberBalance = new uint[](2);
        // Assign the balance and locked amounts
        memberBalance[0] = circle.balances[member];
        memberBalance[1] = circle.userLoan[member];

        balances[i] = memberBalance;
    }

    return (memberAddresses, balances);
    }


    // Set the shuffled payout order (off-chain generated)
    function setPayoutOrder(uint _circleId, address[] memory _payoutOrder) public onlyAiAgent {
        require(_payoutOrder.length == circles[_circleId].members.length, "Payout order length mismatch");
        Circle storage circle = circles[_circleId];
        circle.payoutOrder = _payoutOrder;
        emit PayoutOrderSet(_circleId, _payoutOrder);
    }

    // Refund the cash if the startDate passes and not all members have paid
    function refund(uint _circleId) internal {
        Circle storage circle = circles[_circleId];

        for (uint i = 0; i < circle.members.length; i++) {
            address member = circle.members[i];
            uint refundAmount = circle.balances[member];
            if (refundAmount > 0) {
                //transfer the money back to the member
                processPayout(member, refundAmount);

                //record the withdrawal
                recordWithdrawal(_circleId, member, refundAmount);

                circle.balances[member] = 0;

                emit RefundIssued(_circleId, member, refundAmount);
            }
        }
        // Reset payment status for the next round
        for (uint i = 0; i < circle.members.length; i++) {
            circle.hasSent[circle.members[i]] = false;
        }
         if (circle.cycle + 1 > circle.members.length) {
        circle.round += 1; // Increment the round after one rotation
        }
        circle.payDate += circle.duration  * 24 * 60 * 60;
        circle.cycle++;
        emit RefundUpdated( _circleId);
    }

    // Get all payments
    function getPayments() public view returns (Payment[] memory) {
        return payments;
    }

    // Get all circles
   function getCircles() public view returns (
    uint[] memory, 
    uint[] memory, 
    uint[] memory, 
    uint[] memory, 
    uint[] memory, 
    address[] memory
    ) {
    uint[] memory circleIds = new uint[](circles.length);
    uint[] memory amounts = new uint[](circles.length);
    uint[] memory startDates = new uint[](circles.length);
    uint[] memory durations = new uint[](circles.length);
    uint[] memory loanableAmounts = new uint[](circles.length);        
    address[] memory admins = new address[](circles.length);

    for (uint i = 0; i < circles.length; i++) {
        Circle storage circle = circles[i];
        circleIds[i] = circle.circleId;
        amounts[i] = circle.amount;
        startDates[i] = circle.startDate;
        durations[i] = circle.duration;
        loanableAmounts[i] = circle.loanableAmount;                
        admins[i] = circle.admin;
        }

    return (circleIds, amounts, startDates, durations,loanableAmounts, admins);
    
}

    //function to get circle by id
   function getCircle(uint _circleId) public view returns (
    uint,
    uint,
    uint,
    uint,
    uint,
    uint,
    address,
    address[] memory,
    uint,
    uint,
    uint
    ) {
        Circle storage circle = circles[_circleId];
        return (circle.payDate,circle.amount,circle.startDate,circle.duration,circle.round,circle.cycle,circle.admin,circle.members,circle.loanableAmount, circle.interestPercent, circle.leftPercent);
    }

    //function to get a circle payout order
    function getCirclePayoutOrder(uint _circleId) public view returns (address[] memory) {
        Circle storage circle = circles[_circleId];
        return circle.payoutOrder;
    }

    //function to check that one is member
    function isMember(uint _circleId, address _user) internal view returns (bool) {
        Circle storage circle = circles[_circleId];
        for (uint i = 0; i < circle.members.length; i++) {
            if (circle.members[i] == _user) {
                return true;
            }
        }
        return false;
    }

    // Modifier to restrict function access to members of a circle
    modifier onlyMembers(uint _circleId) {
        bool isAMember = false;
        for (uint i = 0; i < circles[_circleId].members.length; i++) {
            if (msg.sender == circles[_circleId].members[i]) {
                isAMember = true;
                break;
            }
        }
        require(isAMember, "You are not a member of the circle.");
        _;
    }

   //function to withdraw HBAR from the contract (owner only)
  function emergencyWithdraw(address _address, uint _amount) public onlyOwner {
      (bool sent, ) = payable(_address).call{value: _amount}("");
      require(sent, "Transfer failed");
      emit amountWithdrawn(_address, _amount);
  }

   //function to set aiAgent (owner only)
   function setAiAgent(address _aiAgent) public onlyOwner {
       require(_aiAgent != address(0), "Invalid address");
       aiAgent = _aiAgent;
       emit aiAgentSet(_aiAgent);
   }
   
   //modifier for only Admin
   modifier onlyAdmin(uint _circleId){
    require(circles[_circleId].admin == msg.sender, "only the admin can add a member");
    _;
   }

   //modifier for aiAgent
   modifier onlyAiAgent() {
       require(msg.sender == aiAgent || msg.sender == owner, "Only aiAgent or owner");
       _;
   }

   //modifier for owner
   modifier onlyOwner() {
       require(msg.sender == owner, "Only owner can call this function");
       _;
   }
}

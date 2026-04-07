// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LandLoan {
    address public admin;

    enum LoanStatus { Active, Repaid, Defaulted }

    struct Loan {
        string loanId;
        string parcelId;
        address borrower;
        uint256 principal;
        uint256 interestRate;
        uint256 tenureMonths;
        uint256 emiAmount;
        uint256 totalRepayable;
        uint256 amountPaid;
        LoanStatus status;
        uint256 startDate;
        bool exists;
    }

    mapping(string => Loan) public loans;

    event LoanCreated(string indexed loanId, string parcelId, address borrower, uint256 principal);
    event RepaymentRecorded(string indexed loanId, uint256 amount, uint256 totalPaid);
    event LoanRepaid(string indexed loanId, address borrower);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function createLoan(
        string memory loanId,
        string memory parcelId,
        address borrower,
        uint256 principal,
        uint256 interestRate,
        uint256 tenureMonths,
        uint256 emiAmount
    ) external onlyAdmin {
        require(!loans[loanId].exists, "Loan already exists");
        loans[loanId] = Loan({
            loanId: loanId,
            parcelId: parcelId,
            borrower: borrower,
            principal: principal,
            interestRate: interestRate,
            tenureMonths: tenureMonths,
            emiAmount: emiAmount,
            totalRepayable: emiAmount * tenureMonths,
            amountPaid: 0,
            status: LoanStatus.Active,
            startDate: block.timestamp,
            exists: true
        });
        emit LoanCreated(loanId, parcelId, borrower, principal);
    }

    function recordRepayment(string memory loanId, uint256 amount) external onlyAdmin {
        require(loans[loanId].exists, "Loan not found");
        require(loans[loanId].status == LoanStatus.Active, "Loan not active");
        loans[loanId].amountPaid += amount;
        emit RepaymentRecorded(loanId, amount, loans[loanId].amountPaid);
        if (loans[loanId].amountPaid >= loans[loanId].totalRepayable) {
            loans[loanId].status = LoanStatus.Repaid;
            emit LoanRepaid(loanId, loans[loanId].borrower);
        }
    }

    function getLoan(string memory loanId) external view returns (Loan memory) {
        return loans[loanId];
    }
}

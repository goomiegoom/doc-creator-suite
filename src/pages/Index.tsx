// Updated fetchPayeesFromSheet function to remove duplicate loop

function fetchPayeesFromSheet() {
    const payees = [];
    const data = someDataFetchingLogic(); // Assume this fetches the required data

    // Processing fetched data
    for (let item of data) {
        if (item.success) {
            payees.push(item);
        }
    }

    return payees;
}
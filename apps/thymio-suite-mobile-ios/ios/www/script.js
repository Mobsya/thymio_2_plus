// Function to get URL parameters
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  // Display the 'name' parameter value if available
  window.onload = function() {
    const paramValue = getUrlParam('name');  // Replace 'name' with any other parameter
    const displayElement = document.getElementById('paramValue');

    if (paramValue) {
      displayElement.innerHTML = `Hello, ${paramValue}!`;
    } else {
      displayElement.innerHTML = "No 'name' parameter found in the URL.";
    }
  };

  // Example function for button click
  function showAlert() {
    alert('Button clicked!');
  }

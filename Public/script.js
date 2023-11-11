document.addEventListener('DOMContentLoaded', function () {
  const apiLink = document.getElementById('api-link');
  const currentUrlSpan = document.querySelector('#current-url span');
  const endpoints = document.querySelectorAll('.endpoint');

  apiLink.href = "http://localhost:4000/";

  endpoints.forEach(endpoint => {
    endpoint.addEventListener('mouseover', function () {
      const endpointRoute = endpoint.getAttribute('data-endpoint');
      const newUrl = "http://localhost:4000" + endpointRoute;
      apiLink.href = newUrl;
      currentUrlSpan.textContent = newUrl;
    });


  });
});



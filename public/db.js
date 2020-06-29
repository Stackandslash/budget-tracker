//This whole set of stuff shoves content into an IndexedDB record when you're offline.
let db;

//Making a shorthand variable for a new table, version one.
const request = indexedDB.open("budget", 1);

//Creating an option to update content to a new version.
request.onupgradeneeded = function (event) {
  let db = event.target.result; //Pretty much everything is event.target.something down here. Plan accordingly.
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;

  //This important little bit can tell if you're online or not. Seems like it will help avoid tripping errors.
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  console.log("onerror tripped: " + event.target.errorCode);
};

function saveRecord(record) {
  //behold the const chain of character saving
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  store.add(record);
}

function checkDatabase() {
  //It doesn't actually save characters, because we have to grab a specific thing each time, but I'm a little worried about trying to consolidate it. Best practices?
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    //Simply put, we should only get things if there are things to get.
    if (getAll.result.length > 0) {
      //Trying to transition over to fetch, since it seems to be what's getting used in activities lately.
      //The headers may be mandatory? Probably wise for a real product.
      fetch("/api/transaction/getall", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json()) //This is much more compact than JSON.parse and return.
        .then((resp) => {
          //One more time!
          const transaction = db.transaction(["pending"], "readwrite");
          const store = transaction.objectStore("pending");
          store.clear();
        });
    }
  };
}

//Checks periodically for connectivity.
window.addEventListener("online", checkDatabase);

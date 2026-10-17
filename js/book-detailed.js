// display truncated text to keep the design and display a glance of data available easily
function truncateText(elementId, fullText, maxLength) {
    if (fullText.length <= maxLength) {
        $("#" + elementId).text(fullText);
        return;
    }

    const shortText = fullText.slice(0, maxLength) + "...";

    $("#" + elementId).html(
        shortText + ' <a href="#" class="read-more-btn">Read more</a>'
    );

    $("#" + elementId).on("click", ".read-more-btn", function (e) {
        e.preventDefault();
        const isExpanded = $(this).text() === "Read less";

        if (isExpanded) {
            $("#" + elementId).html(
                shortText + ' <a href="#" class="read-more-btn">Read more</a>'
            );
        } else {
            $("#" + elementId).html(
                fullText + ' <a href="#" class="read-more-btn">Read less</a>'
            );
        }
    });
}

$(document).ready(function () {
  // read the book key from the url
  const params = new URLSearchParams(window.location.search);
  const key = params.get("key");

  // A guard against someone directly typing the url, a broken link etc
  if (!key) {
    window.location.href = "reading-corner.html";
    return;
  }

  // set the open library link
  $("#open-library-link").attr("href", "https://openlibrary.org" + key);

  // fetch book data from the open library api-
  $.getJSON("https://openlibrary.org" + key + ".json", function (data) {
    // title
    $("#book-title").text(data.title || "Unknown Title");

    // Year
    if (data.first_publish_date) {
      $("#book-year").text(data.first_publish_date);
    }

    // description
    const description =
      typeof data.description === "object"
        ? data.description.value
        : data.description || "No description available.";

    truncateText("book-description", description, 500);
    truncateText("about-book", description, 300);

    // cover
    if (data.covers && data.covers.length > 0) {
      const coverUrl = `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`;
      $("#book-cover")
        .attr("src", coverUrl)
        .attr("alt", data.title + " cover");
    }

    // genres - only first 4
    if (data.subjects && data.subjects.length > 0) {
      data.subjects.slice(0, 4).forEach(function (genre) {
        $("#book-genres").append(
          `<span class="badge bg-secondary me-1">${genre}</span>`,
        );
      });
    }

    // author - fetch from second api call open library sends "author_key"
    if (data.authors && data.authors.length > 0) {
      const authorKey = data.authors[0].author.key;

      $.getJSON(
        "https://openlibrary.org" + authorKey + ".json",
        function (author) {
          $("#book-author").text(author.name || "Unknown Author");
          $("#author-name").text(author.name || "Unknown Author");

          // author bio. can be a string or object
          const bio =
            typeof author.bio === "object"
              ? author.bio.value
              : author.bio || "No bio-data available.";

          truncateText("author-bio", bio, 200);

          // author photo
          if (author.photos && author.photos.length > 0) {
            const photoUrl = `https://covers.openlibrary.org/a/id/${author.photos[0]}-M.jpg`;
            $("#author-photo").attr("src", photoUrl).attr("alt", author.name);
          } else {
            $("#author-photo").hide();
          }
        },
      );
    }
  });

    // check if the book is already saved on page load
    const list = JSON.parse(localStorage.getItem("readingList") || "[]");
    const alreadySaved = list.find(function (b) {
    return b.key === key;
    });

    if (alreadySaved) {
    $("#save-btn").text("Saved").prop("disabled", true);
    }

    // save books
    $("#save-btn").on("click", function () {
    const currentList = JSON.parse(localStorage.getItem("readingList") || "[]");
    const exists = currentList.find(function (b) {
        return b.key === key;
    });

    if (exists) {
        $("#save-btn").text("Already saved").prop("disabled", true);
        return;
    }

    currentList.push({
        key: key,
        title: $("#book-title").text(),
        author: $("#book-author").text(),
        cover: $("#book-cover").attr("src"),
        status: "to-read",
        savedAt: Date.now(),
    });

    localStorage.setItem("readingList", JSON.stringify(currentList));
    $("#save-btn").text("Saved").prop("disabled", true);
    });

});

const RESULTS_PER_PAGE = 12;
const OPENLIBRARY_BASE_URL = "https://openlibrary.org";
let currentPage = 1;
let currentQuery = "";
let currentSearchBy = "q";
let totalPages = 1;

function buildUrl(query, field, page) {
    const offset = (page - 1) * RESULTS_PER_PAGE;
    const sort = $("#sort-by").val();
    const genre = $("#genre-filter").val();
    const year = $("#year-filter").val();
    const search = (query) ? `${field}=${encodeURIComponent(query)}&` : "q=classic_fiction&";
    let url = `${OPENLIBRARY_BASE_URL}/search.json?${search}limit=${RESULTS_PER_PAGE}&offset=${offset}&fields=key,title,author_name,first_publish_year,cover_i`;
    if (sort) url +=  `&sort=${sort}`;
    if (genre) url += `&subject=${genre}`;
    if (year) url += `&first_publish_year=${year}`;
    return url;
}

function renderBooks(books) {
    $("#results-grid").empty();

    if (books.length === 0) {
        $("#results-grid").html('<p class="text-muted">No books found. Try a different search.</p>');
        return;
    }

    $.each(books, function (i, book) {
        const cover = book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : "images/no-image.jpg";

        const author = book.author_name ? book.author_name[0] : "Unknown author";

        const year = book.first_publish_year || "";

        const card =  `
            <div class="col-sm-6 col-md-4 col-lg-3">
            <div class="card h-100 shadow-sm">
                <img src="${cover}" class="card-img-top" alt="${book.title} cover" style="height:200px; object-fit:cover;" />
                <div class="card-body d-flex flex-column">
                <h6 class="card-title">${book.title}</h6>
                <p class="card-text text-muted small">${author} &middot; ${year}</p>
                <div class="mt-auto d-flex gap-2">
                    <a href="book-detailed.html?key=${encodeURIComponent(book.key)}" class="btn btn-outline-light btn-sm flex-fill">View details</a>
                    <button class="btn btn-outline-secondary btn-sm save-btn"
                    data-key="${book.key}"
                    data-title="${book.title}"
                    data-author="${author}"
                    data-year="${year}"
                    data-cover="${cover}">Save</button>
                </div>
                </div>
            </div>
            </div>`;
        
        $("#results-grid").append(card);
    });

    $(".save-btn").on("click", function () {
        const btn = $(this);

        const list = JSON.parse(localStorage.getItem("readingList") || "[]");

        const exists = list.find(function (b) {
            return b.key === btn.data("key");
        });

        if (exists) {
             btn.text("Already saved").prop("disabled", true);
            return;
        }

        list.push({
            key: btn.data("key"),
            title: btn.data("title"),
            author: btn.data("author"),
            year: btn.data("year"),
            cover: btn.data("cover"),
            status: "to-read",
            savedAt: Date.now()
        });

        localStorage.setItem("readingList", JSON.stringify(list));
        btn.text("Saved").prop("disabled", true);
    });
}

function searchBooks(query, field, page, label) {
    $("#results-grid").html('<p class="text-muted">Searching...</p>');
    $("#pagination").addClass("d-none");

    $.getJSON(buildUrl(query, field, page), function (data) {
        totalPages = Math.ceil(data.numFound / RESULTS_PER_PAGE);

        $("#results-count")
        .text(label || `Search results for "${query}" — ${data.numFound} books found`)
        .removeClass("d-none");

        renderBooks(data.docs);

        if (totalPages > 1) {
            $("#pagination").removeClass("d-none");
            $("#page-info").text(`Page ${page} of ${totalPages}`);
            $("#prev-btn").prop("disabled", page === 1);
            $("#next-btn").prop("disabled", page === totalPages);
        }
    });
}

$(document).ready(function () {
    $("#search-form").on("submit", function (e) {
        e.preventDefault();
        currentQuery = $("#search-input").val().trim();
        currentSearchBy = $("#search-by").val();
        currentPage = 1;
        searchBooks(currentQuery, currentSearchBy, currentPage);
    });

    $("#sort-by").on("change", function () {                                                                                                                                                                                
        if (currentQuery) {                                                                                                                                                                                                 
            searchBooks(currentQuery, currentSearchBy, 1);                                                                                                                                                                  
        }                                                                                                                                                                                                                   
    });

    $("#year-filter").on("change", function () {                                                                                                                                                                                
        $("#year-filter-label").text($(this).val());
        if(currentQuery) {
            searchBooks(currentQuery, currentSearchBy, 1);
        }                                                                                                                                                                                                            
    });

    $("#prev-btn").on("click", function () {
      if (currentPage > 1) {
        currentPage--;
        searchBooks(currentQuery, currentSearchBy, currentPage);
        window.scrollTo(0, 0);
      }
    });

    $("#next-btn").on("click", function () {
      if (currentPage < totalPages) {
        currentPage++;
        searchBooks(currentQuery, currentSearchBy, currentPage);
        window.scrollTo(0, 0);
      }
    });

    // load featured books on page load
    currentQuery = "classic fiction";
    currentSearchBy = "q";
    searchBooks(currentQuery, currentSearchBy, 1, "Popular books to explore");
})
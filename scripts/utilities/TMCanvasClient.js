/**
 * A client for interacting with the Canvas LMS REST API for a specific course.
 * Reads the course ID from the global ENV object and handles paginated
 * responses automatically.
 */

class TMCanvasClient {
  /**
   * Creates a new TMCanvasClient bound to the current Canvas course context.
   */
  constructor() {
    this.COURSE_ID = ENV.current_context.id;
    this.BASE_URL = "https://uia.instructure.com/api/v1";
  }

  /**
   * Logs a welcome message to the console.
   */
  welcome() {
    console.log("Welcome to the TM Canvas Client");
  }

  /**
   * Returns metadata about the course, including syllabus body (regardless of default view).
   * If the front page of the course is a wiki-page, also fetches and
   * appends the front page.
   * @returns {Promise<Object>} Resolves to a Course object appended with
   * front page info if available.
   */
  async getCourseInfo() {
    try {
      const res = await fetch(
        `${this.BASE_URL}/courses/${this.COURSE_ID}?include[]=syllabus_body`,
      );
      const data = await res.json();

      if (data.default_view === "wiki") {
        const frontPage = await this.getFrontPage();
        data._front_page = frontPage;
      }

      return data;
    } catch (err) {
      console.error("Unable to get course info.", err);
    }
  }

  /**
   * Retrieves the frontpage of a course.
   * @returns {Promise<Object>} Resolve with a page object, including the page body.
   */
  async getFrontPage() {
    try {
      const res = await fetch(
        `${this.BASE_URL}/courses/${this.COURSE_ID}/front_page`,
      );
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Unable to fetch front page.", err);
    }
  }

  /**
   * Recursively fetches all modules for the course, following Canvas'
   * paginated "next" links until no more pages remain.
   *
   * @param {string} [url=''] - The URL to fetch. Defaults to the course's
   *   modules endpoint; used internally for recursive pagination calls.
   * @param {Array<Object>} [modules=[]] - Accumulator of modules gathered
   *   so far across recursive calls.
   * @returns {Promise<Array<Object>>} Resolves with the full list of modules,
   *   or undefined if a request fails.
   */
  async listModules(url = "", modules = []) {
    try {
      if (url === "") {
        url = `${this.BASE_URL}/courses/${this.COURSE_ID}/modules`;
      }
      const res = await fetch(url);
      const data = await res.json();
      modules = modules.concat(data);
      const nextLink = this.#findNextLink(res);
      if (nextLink) {
        return await this.listModules(nextLink, modules);
      } else {
        return modules;
      }
    } catch (err) {
      console.error("Unable to list modules", err);
    }
  }

  /**
   * Recursively fetches all pages for the course, following Canvas'
   * paginated "next" links until no more pages remain.
   *
   * @param {Array<string>} [query=''] - Query parameters (see Canvas API documentation). inlude[]=body for body.
   * @param {string} [url=''] - The URL to fetch. Defaults to the course's
   *   modules endpoint; used internally for recursive pagination calls.
   * @param {Array<Object>} [pages=[]] - Accumulator of pages gathered
   *   so far across recursive calls.
   * @returns {Promise<Array<Object>>} Resolves with the full list of pages,
   *   or undefined if a request fails.
   */
  async listPages(query = "", url = "", pages = []) {
    try {
      if (url === "") {
        if (query === "") {
          url = `${this.BASE_URL}/courses/${this.COURSE_ID}/pages`;
        } else {
          url = `${this.BASE_URL}/courses/${this.COURSE_ID}/pages?${query.join("&")}`;
        }
      }
      const res = await fetch(url);
      const data = await res.json();
      pages = pages.concat(data);
      const nextLink = this.#findNextLink(res);
      if (nextLink) {
        return await this.listPages("", nextLink, pages);
      } else {
        return pages;
      }
    } catch (err) {
      console.error("Unable to list pages", err);
    }
  }

  /**
   * Fetches a course module and the module's items and, for any items of type "Page",
   * retrieves the full page content and attaches it as `_page_info`.
   *
   * @returns {Promise<Array<Object>>} Modules, each augmented with a
   *   `_module_items` array; page items include `_page_info`.
   */
  async listModulesWithItemsAndPageContent() {
    const modules = await this.listModules();

    for (const module of modules) {
      const items = await this.listModuleItems(module.items_url);

      for (const item of items) {
        if (item.type === "Page") {
          const page = await this.getPage(item.url);
          if (page) {
            item._page_info = page;
          } else {
            item._page_info = null;
          }
        }
      }
      module._module_items = items;
    }

    return modules;
  }

  /**
   * Fetches a single page.
   *
   * @param {string} url - The url for the page to fetch.
   * @returns {Promise<Object>} - Resolves with a Page object which includes the page body
   * since this only fetches a single page.
   */
  async getPage(url) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Unable to get page", err);
    }
  }

  /**
   * Updates a page with a new body (optionally) and title (optionally)
   *
   * @param {string}[id] - Page id or url.
   * @param {string}[body=''] - The new page body (html) as a string.
   * @param {string}[title=''] - The new page title.
   * @returns {Promise<Object || null>} - Resolves with the http response or null if neither body nor title is given.
   */
  async updatePageContent(id, body = "", title = "") {
    if (body === "" && title === "") return null;

    try {
      const res = await fetch(
        `${this.BASE_URL}/courses/${this.COURSE_ID}/pages/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": this.#CSRFtoken(),
          },
          body: JSON.stringify({
            wiki_page: {
              ...(body !== "" && { body: body }),
              ...(title !== "" && { title: title }),
            },
          }),
        },
      );
      return res;
    } catch (err) {
      console.error("Unable to update page", err);
    }
  }

  /**
   * Recursively fetches all items for a module, following Canvas'
   * paginated "next" links until no more pages remain.
   *
   * @param {string} [url=''] - The URL to fetch a specific module.
   * @param {Array<Object>} [items=[]] - Accumulator of items gathered
   *   so far across recursive calls.
   * @returns {Promise<Array<Object>>} Resolves with the full list of module items,
   *   or undefined if a request fails.
   */
  async listModuleItems(url, items = []) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      items = items.concat(data);
      const nextLink = this.#findNextLink(res);
      if (nextLink) {
        return await this.listModuleItems(nextLink, items);
      } else {
        return items;
      }
    } catch (err) {
      console.error("Unable to list module items", err);
    }
  }

  /**
   * Extracts the "next" pagination link from a Canvas API response's
   * Link header, per RFC 5988 link-header format.
   *
   * @param {Response} results - The fetch Response object to inspect.
   * @returns {string|false} The next page's URL, or false if none exists.
   */
  #findNextLink(results) {
    let responseHeaders = [...results.headers];
    let linkHeader = responseHeaders.find(
      (el) => el[0].toLowerCase() === "link",
    );
    let textArray = linkHeader[1].split(",");
    for (const link of textArray) {
      let [url, rel] = link.split(";");
      if (rel.includes("next")) {
        // Remove the < and > from start and end.
        return url.substring(1, url.length - 1);
      }
    }
    return false;
  }

  #CSRFtoken() {
    return decodeURIComponent(
      (document.cookie.match("(^|;) *_csrf_token=([^;]*)") || "")[2],
    );
  }
}

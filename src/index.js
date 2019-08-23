import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import memoize from "memoize-one";

import "./styles.scss";

class SearchResults extends React.Component {
  filter = memoize((list, filterText) => {
    const textToMatch = filterText.toLowerCase();
    const results = list.filter(dataItem => {
      return Object.keys(dataItem)
        .filter(f => f !== "id")
        .some(field => {
          return dataItem[field].data
            ? dataItem[field].data.toLowerCase().startsWith(textToMatch)
            : "";
        });
    });
    return results;
  });

  constructor(props) {
    super(props);
    const { data } = this.props;
    this.state = {
      closed: false,
      searchValue: "",
      allData: [],
      currentData: data.length > 0 ? data.slice(0, 1) : []
    };
    this.handleExpandClick = this.handleExpandClick.bind(this);
    this.handleCollapseClick = this.handleCollapseClick.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.loadData = this.loadData.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.itemsContainerRef = React.createRef();
    this.dataItemRef = React.createRef();
  }

  componentDidMount() {
    const { data } = this.props;
    this.setState(() => ({
      allData: data.slice(3, data.length),
      currentData: data.slice(0, 3)
    }));

    console.log(this.itemsContainerRef.current.clientHeight);
    console.log(this.dataItemRef.current);
  }

  loadData() {
    const { allData, currentData } = this.state;
    this.setState(() => ({
      currentData: [...currentData, ...allData.slice(0, 3)],
      allData: allData.slice(3, allData.length)
    }));
  }

  handleExpandClick() {
    this.setState(() => ({
      closed: false
    }));
  }

  handleCollapseClick() {
    this.setState(() => ({
      closed: true
    }));
  }

  handleSearchChange(event) {
    this.setState({ searchValue: event.target.value });
  }

  handleScroll(event) {
    const element = event.target;
    const bottom =
      element.scrollHeight - element.scrollTop === element.clientHeight;

    if (bottom) {
      this.loadData();
    }
  }

  render() {
    const {
      layout,
      showFiltering,
      jumpLinks,
      title,
      searchBoxLabel,
      data
    } = this.props;
    const { closed, searchValue, currentData } = this.state;
    const filteredList = this.filter(currentData, searchValue);
    // TODO: make this dynamic based on user selection
    let selected = "selected"; // temporary - will make this dynamic based on selected item
    let leftIcons;
    let middleIcons;
    let collapseIcon;
    const renderJumpLinks = jumpLinks.map(l => (
      <a className="skip-link" href={l.url}>
        {l.text}
      </a>
    ));
    const resultCountLabel =
      data.length > 0 ? `${data.length} results` : "No Results";

    if (layout === "left") {
      leftIcons = (
        <div className="icons">
          {showFiltering ? (
            <button type="button" aria-label="Filter">
              <i className="cb-glyph cb-filter filter-icon" />
              <span className="action-text">Filter</span>
            </button>
          ) : null}

          <button type="button" aria-label="Reset">
            <i className="nav-icon material-icons replay-icon">replay</i>
            <span className="action-text">Reset</span>
          </button>
        </div>
      );

      collapseIcon = (
        <div className="collapse-icon">
          <button
            type="button"
            aria-expanded="false"
            aria-label="Close search results"
            onClick={this.handleCollapseClick}
          >
            <i className="cb-glyph cb-dbl-left" />
          </button>
        </div>
      );
    } else if (layout === "middle") {
      middleIcons = (
        <div className="icons">
          {showFiltering ? (
            <button type="button" aria-label="Filter">
              <i className="cb-glyph cb-filter filter-icon" />
            </button>
          ) : null}

          <button type="button" aria-label="Add item">
            <i className="cb-glyph cb-plus" />
          </button>
        </div>
      );
    }

    return (
      <div className={`search-results ${closed ? "sr-collapse" : ""}`}>
        {closed}
        {renderJumpLinks}
        <div className="expand-icon">
          <button
            value="false"
            type="button"
            aria-expanded="true"
            aria-label="Open search results"
            onClick={this.handleExpandClick}
          >
            <i className="cb-glyph cb-dbl-right" />
          </button>
        </div>

        <div className={`${layout}-layout`}>
          <div className="search-results-controls">
            <h2>{title}</h2>

            {collapseIcon}
            {middleIcons}

            <div className="result-count" aria-label={resultCountLabel}>
              {resultCountLabel}
            </div>

            {leftIcons}

            <div className="cb-input-search input-container">
              <input
                type="text"
                className="form-control"
                placeholder={searchBoxLabel}
                aria-label={searchBoxLabel}
                onChange={this.handleSearchChange}
              />
              <i className="cb-glyph cb-search" aria-hidden="true" />
            </div>
          </div>

          <ul
            className="items-container"
            ref={this.itemsContainerRef}
            onScroll={this.handleScroll}
          >
            {filteredList.map(dataItem => {
              const fieldsWithoutLabels = Object.keys(dataItem).filter(
                field => dataItem[field].includeLabel === false
              );
              const fieldsWithoutLabelsHTML = fieldsWithoutLabels.map(field => {
                return (
                  <span
                    key={field}
                    className={
                      dataItem[field].boldFont ? "main-item" : "secondary-item"
                    }
                  >
                    {dataItem[field].data}
                  </span>
                );
              });

              const fieldsWithLabels = Object.keys(dataItem).filter(
                field => dataItem[field].includeLabel === true
              );

              const fieldsWithLabelsHTML = fieldsWithLabels.map(field => {
                return (
                  <>
                    <dt
                      className={
                        dataItem[field].boldFont
                          ? "main-item"
                          : "secondary-item"
                      }
                    >
                      {dataItem[field].label}
                    </dt>
                    <dd
                      className={
                        dataItem[field].boldFont
                          ? "main-item"
                          : "secondary-item"
                      }
                    >
                      {dataItem[field].data}
                    </dd>
                  </>
                );
              });

              const dl =
                fieldsWithLabelsHTML.length > 0 ? (
                  <dl>{fieldsWithLabelsHTML}</dl>
                ) : null;

              const li = (
                <li
                  ref={this.dataItemRef}
                  className={`item-container ${selected}`}
                  key={dataItem.id}
                >
                  {fieldsWithoutLabelsHTML}
                  {dl}
                </li>
              );
              selected = "";
              return li;
            })}
          </ul>
        </div>
      </div>
    );
  }
}

SearchResults.defaultProps = {
  layout: "left",
  title: "",
  jumpLinks: [],
  showFiltering: false,
  searchBoxLabel: "",
  data: []
};

SearchResults.propTypes = {
  layout: PropTypes.oneOf(["left", "middle"]),
  showFiltering: PropTypes.bool,
  title: PropTypes.string,
  jumpLinks: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired
    })
  ),
  searchBoxLabel: PropTypes.string,
  data: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired }))
  /*
    data prop: sample shape
    [{
    id: '1',
    name: {
      data: 'Pierre K Board',
      includeLabel: false,
      boldFont: true
    },
    'School ID': {
      data: '128-41-2391',
      includeLabel: true,
      boldFont: false,
      label: 'School ID #'
    }
  }]
  */
};

const rootElement = document.getElementById("root");
ReactDOM.render(
  <div style={{ width: "350px", height: "450px", margin: "20px 0 0 20px" }}>
    <SearchResults
      title="Search Results"
      jumpLinks={[{ url: "#main", text: "skip link" }]}
      layout="left"
      data={[
        {
          id: "1",
          name: {
            data: "Pierre K Board",
            includeLabel: false,
            boldFont: true
          },
          "School ID #": {
            data: "128-41-2391",
            includeLabel: true,
            boldFont: false,
            label: "School ID #"
          }
        },
        {
          id: "2",
          name: {
            data: "Naomí Yepes",
            includeLabel: false,
            boldFont: true
          },
          "School ID #": {
            data: "325-41-2391",
            includeLabel: true,
            boldFont: false,
            label: "School ID #"
          }
        }
      ]}
    />
  </div>,
  rootElement
);

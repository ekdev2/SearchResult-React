import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import memoize from "memoize-one";

import "./styles.scss";

class SearchResults extends React.Component {
  constructor(props) {
    super(props);
    const { data } = this.props;
    this.state = {
      closed: false,
      searchValue: "",
      allData: [],
      initialAmountOfItemsToRender: 0,
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
    this.resetDataList(data, "", true);
  }

  initialAmountOfItemsToRender = () => {
    const containerHeight = this.itemsContainerRef.current.clientHeight;
    const itemHeight = this.dataItemRef.current
      ? this.dataItemRef.current.clientHeight
      : 0;
    let items = 1;

    if (itemHeight > 0 && containerHeight > itemHeight) {
      items = Math.ceil(containerHeight / itemHeight) + 1;
    }

    return items;
  };

  resetDataList = (dataList, searchValue, initialLoad) => {
    const { initialAmountOfItemsToRender } = this.state;
    const amountOfItemsToRender = initialLoad
      ? this.initialAmountOfItemsToRender()
      : initialAmountOfItemsToRender;
    this.setState(() => ({
      allData: dataList.slice(amountOfItemsToRender, dataList.length),
      currentData: dataList.slice(0, amountOfItemsToRender),
      test: "",
      searchValue: searchValue,
      initialAmountOfItemsToRender: initialLoad
        ? amountOfItemsToRender
        : initialAmountOfItemsToRender
    }));
  };

  loadData() {
    const { allData, currentData } = this.state;
    this.setState(() => ({
      currentData: [...currentData, ...allData.slice(0, 3)],
      allData: allData.slice(3, allData.length)
    }));
  }

  filter = (list, filterText) => {
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
  };

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
    const { data } = this.props;
    const searchValue = event.target.value;
    const filteredList = this.filter(data, searchValue);
    this.resetDataList(filteredList, searchValue);
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
                value={searchValue}
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
            {currentData.map(dataItem => {
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
  <div style={{ width: "350px", height: "550px", margin: "20px 0 0 20px" }}>
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
        },
        {
          id: "3",
          name: {
            data: "Justine Marshall",
            includeLabel: false,
            boldFont: true
          },
          "School ID #": {
            data: "426-41-2391",
            includeLabel: true,
            label: "School ID #",
            boldFont: false
          }
        },
        {
          id: "4",
          name: {
            data: "Yogarasa Gandhi",
            includeLabel: false,
            boldFont: true
          },
          "School ID #": {
            data: "776-41-2391",
            includeLabel: true,
            label: "School ID #",
            boldFont: false
          }
        },
        {
          id: "5",
          name: {
            data: "John Brown",
            includeLabel: false,
            boldFont: true
          },
          "School ID #": {
            data: "776-41-2391",
            label: "School ID #",
            includeLabel: true,
            boldFont: false
          }
        },
        {
          id: "6",
          name: {
            data: "Jason Redd",
            includeLabel: false,
            boldFont: true
          },
          "School ID #": {
            data: "776-41-2391",
            includeLabel: true,
            label: "School ID #",
            boldFont: false
          }
        },
        {
          id: "7",
          name: {
            data: "Dan Rosen",
            includeLabel: false,
            boldFont: true
          },
          "School ID #": {
            data: "776-41-2391",
            includeLabel: true,
            label: "School ID #",
            boldFont: false
          }
        },
        {
          id: "8",
          name: {
            data: "Dan Rosen2",
            includeLabel: false,
            boldFont: true
          },
          "School ID #": {
            data: "776-41-2391",
            includeLabel: true,
            label: "School ID #",
            boldFont: false
          }
        },
        {
          id: "9",
          name: {
            data: "Dan Rosen3",
            includeLabel: false,
            boldFont: true
          },
          "School ID #": {
            data: "776-41-2391",
            includeLabel: true,
            label: "School ID #",
            boldFont: false
          }
        },
        {
          id: "10",
          name: {
            data: "Dan Rosen4",
            includeLabel: false,
            boldFont: true
          },
          "School ID #": {
            data: "776-41-2391",
            includeLabel: true,
            label: "School ID #",
            boldFont: false
          }
        },
        {
          id: "11",
          name: {
            data: "Dan Rosen5",
            includeLabel: false,
            boldFont: true
          },
          "School ID #": {
            data: "776-41-2391",
            includeLabel: true,
            label: "School ID #",
            boldFont: false
          }
        },
        {
          id: "12",
          name: {
            data: "Dan Rosen76",
            includeLabel: false,
            boldFont: true
          },
          "School ID #": {
            data: "776-41-2391",
            includeLabel: true,
            label: "School ID #",
            boldFont: false
          }
        },
        {
          id: "13",
          name: {
            data: "Dan Rosen8",
            includeLabel: false,
            boldFont: true
          },
          "School ID #": {
            data: "776-41-2391",
            includeLabel: true,
            label: "School ID #",
            boldFont: false
          }
        },
        {
          id: "14",
          name: {
            data: "Dan Rosen9",
            includeLabel: false,
            boldFont: true
          },
          "School ID #": {
            data: "776-41-2391",
            includeLabel: true,
            label: "School ID #",
            boldFont: false
          }
        }
      ]}
    />
  </div>,
  rootElement
);

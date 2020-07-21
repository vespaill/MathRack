import React, { Component } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { Container } from 'react-bootstrap';
import NavBarBottom from './components/navBarBottom';
import Inventory from './components/inventory';
import NotFound from './components/common/notFound';
import LoadPlateCalc from './components/loadPlateCalc';
import { modQuantity, expandFromQuantity } from './utils/inventory';
import { toKg } from './utils/toKg';
import { calcBgColor } from './utils/calcBgColor';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './css/App.css';
import './css/utils.css';

const MAX_PLATES = 8;

class App extends Component {
  state = {
    inventory: {
      unit: 'lbs',
      barbell: {
        lbs: 45,
        kg: toKg(45)
      },
      availablePlates: {
        lbs: [
          { value: 100, quantity: 0 },
          { value: 65, quantity: 0 },
          { value: 55, quantity: 0 },
          { value: 50, quantity: 0 },
          { value: 45, quantity: 8 },
          { value: 35, quantity: 0 },
          { value: 25, quantity: 8 },
          { value: 20, quantity: 0 },
          { value: 15, quantity: 0 },
          { value: 12.5, quantity: 0 },
          { value: 10, quantity: 8 },
          { value: 7.5, quantity: 0 },
          { value: 5, quantity: 8 },
          { value: 2.5, quantity: 8 },
          { value: 1.25, quantity: 0 },
          { value: 1, quantity: 0 },
          { value: 0.75, quantity: 0 },
          { value: 0.5, quantity: 0 },
          { value: 0.25, quantity: 0 }
        ],
        kg: [
          { value: 50, quantity: 0 },
          { value: 45, quantity: 0 },
          { value: 35, quantity: 0 },
          { value: 30, quantity: 0 },
          { value: 25, quantity: 0 },
          { value: 20, quantity: 8 },
          { value: 15, quantity: 0 },
          { value: 12.5, quantity: 0 },
          { value: 10, quantity: 8 },
          { value: 7.5, quantity: 0 },
          { value: 5, quantity: 8 },
          { value: 3, quantity: 0 },
          { value: 2.5, quantity: 8 },
          { value: 2, quantity: 0 },
          { value: 1.5, quantity: 0 },
          { value: 1.25, quantity: 0 },
          { value: 1, quantity: 0 },
          { value: 0.75, quantity: 0 },
          { value: 0.5, quantity: 0 },
          { value: 0.25, quantity: 0 }
        ]
      }
    },
    calculatedPlates: []
  };

  componentDidMount() {
    let availablePlates = {};

    ['lbs', 'kg'].forEach(unit => {
      availablePlates[unit] = this.state.inventory.availablePlates[
        unit
      ].map((plate, index) => ({ ...plate, color: calcBgColor(index) }));
    });

    const { inventory } = this.state;
    inventory.availablePlates = availablePlates;
    this.setState({ inventory });
  }

  render() {
    const { unit, barbell } = this.state.inventory;
    return (
      <>
        <Container style={{ paddingBottom: '70px' }}>
          <ToastContainer
            limit={1}
            autoClose={2000}
            hideProgressBar
            pauseOnFocusLoss={false}
            draggable={false}
            pauseOnHover={false}
          />
          <Switch>
            <Route
              path="/rackmath"
              render={() => (
                <LoadPlateCalc
                  unit={unit}
                  barbell={barbell[unit]}
                  calculatedPlates={this.state.calculatedPlates}
                  onSubmit={this.handleLoadSubmit}
                />
              )}
            />
            <Route
              path="/inventory"
              render={() => (
                <Inventory
                  data={this.state.inventory}
                  onUnitClick={this.handleUnitClick}
                  onPlateGroupClick={this.handlePlateGroupClick}
                />
              )}
            />
            <Route path="/not-found" component={NotFound} />
            <Redirect from="/" exact to="/rackmath" />
            <Redirect to="/not-found" />
          </Switch>
        </Container>
        <NavBarBottom />
      </>
    );
  }

  handleUnitClick = () => {
    let inventory = {...this.state.inventory};
    if (inventory.unit === 'lbs') inventory.unit = 'kg';
    else inventory.unit = 'lbs';
    this.setState({ inventory });
  };

  handlePlateGroupClick = value => {
    const { unit } = this.state.inventory;
    const original = { ...this.state.inventory.availablePlates };
    const index = original[unit].findIndex(element => element.value === value);
    original[unit][index].quantity = (original[unit][index].quantity + 2) % 10;

    this.setState({ availablePlates: original });
  };

  handleLoadSubmit = e => {
    e.preventDefault();

    const { value: load } = e.currentTarget.loadInput;
    const { unit, availablePlates } = this.state.inventory;
    const barbell = this.state.inventory.barbell[unit];
    const halfQuantity = modQuantity(availablePlates[unit], 0.5);
    const plateObjs = expandFromQuantity(halfQuantity);

    const { valid, errMsg } = this.validateLoad(load, barbell, plateObjs);
    if (!valid) toast.error(errMsg);
    else {
      const { success, warn, calcdPlateObjs } = this.calculatePlates(
        unit,
        load,
        barbell,
        plateObjs
      );
      if (warn) toast.error(warn);
      if (success) this.setState({ calculatedPlates: calcdPlateObjs });
    }
  };

  validateLoad = (load, barbell, plateObjs) => {
    if (load < barbell)
      return {
        errMsg: "That's not even the bar!",
        valid: false
      };

    const totalWeightAvail =
      barbell + 2 * plateObjs.reduce((prv, cur) => prv + cur.value, 0);

    if (load > totalWeightAvail)
      return {
        errMsg: "Your inventory doesn't work with that weight",
        valid: false
      };

    return { valid: true };
  };

  /**
   * Returns an array containing the plates (weights) that must loaded on one
   * side of a barbell in order to meet a target load.
   * @param {Number} targetLoad Weight to load onto barbell
   * @param {Number} barbell Weight of the barbell
   * @param {Array} plateObjs array of weight value and color pairs.
   */
  calculatePlates = (unit, targetLoad, barbell, plateObjs) => {
    let workingLoad = targetLoad - barbell;
    if (workingLoad === 0)
      return {
        success: true,
        warn: 'Just the bar',
        calcdPlateObjs: []
      };

    /* Showing how to load one side of the barbell. Presumably, both sides are
       identical. */
    workingLoad /= 2;
    let calcdPlateObjs = [];

    for (let plate of plateObjs) {
      if (workingLoad >= plate.value) {
        calcdPlateObjs.push(plate);
        if (calcdPlateObjs.length > MAX_PLATES)
          return {
            success: false,
            warn: 'Not enough room on the bar!'
          };
        workingLoad -= plate.value;
      }
    }

    if (workingLoad !== 0) {
      return {
        success: true,
        warn: `${workingLoad * 2} ${unit} has been rounded off.`,
        calcdPlateObjs
      };
    }
    return {
      success: true,
      warn: `${targetLoad} ${unit} loaded!`,
      calcdPlateObjs
    };
  };
}

export default App;

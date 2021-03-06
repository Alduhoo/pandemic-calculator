import * as React from 'react';
import './App.css';

import logo from './logo.svg';

import { CitySelector } from './Components/CitySelector';
import { PandemicRounds } from './Components/PandemicRounds';

interface IAppState {
    epidemic: boolean;
    infectionDeck: {[city: string]: number};
    rounds: [{[city: string]: number}];
}

const initialCities = {
    'Atlanta': 3,
    'Buenos Aires': 2,
    'Cairo': 3,
    'Chicago': 2,
    'Denver': 1,
    'Istanbul': 3,
    'Jacksonville': 3,
    'Lagos': 3,
    'London': 3,
    'New York': 3,
    'Santiago': 3,
    'São Paulo': 3,
    'Tripoli': 3,
    'Washington': 3,
};

class App extends React.Component<{}, IAppState> {
    public static getTotalCount(round: {[city: string]: number}): number {
        let count = 0;
        // tslint:disable-next-line:forin
        for (const city in round) {
            count += round[city];
        }

        return count;
    }

    private static getInitialRound(cities: {[city: string]: number}): {[city: string]: number} {
        const round: {[city: string]: number} = {};
        // tslint:disable-next-line:forin
        for (const city in cities) {
            round[city] = 0;
        }

        return round;
    }

    private static getDifference(a: {[city: string]: number}, b: {[city: string]: number}): {[city: string]: number} {
        const diff = {};
        // tslint:disable-next-line:forin
        for (const city in a) {
            diff[city] = a[city] - b[city];
        }

        return diff;
    }

    private static getProbabilities(round: {[city: string]: number}): {[city: string]: number} {
        const totalCount = App.getTotalCount(round);
        const result = {};

        // tslint:disable-next-line:forin
        for (const city in round) {
            result[city] = totalCount === 0 ? 0 : round[city] / totalCount;
        }

        return result;
    }

    private static getInfectedCities(state: IAppState): {[city: string]: number} {
        if (state.rounds.length <= 1) {
            return state.infectionDeck;
        }

        const infectedCities = {};
        state.rounds.forEach((r, i, a) => {
            // We don't want to count the last round
            if (i === a.length - 1) {
                return;
            }

            for (const city in r) {
                if (infectedCities[city]) {
                    infectedCities[city] = Math.max(infectedCities[city], r[city]);
                } else {
                    infectedCities[city] = r[city];
                }
            }
        });

        return infectedCities;
    }

    private static getCityProbabilities(state: IAppState): {[city: string]: number} {
        const roundIndex = state.rounds.length - 1;
        const currentRound = state.rounds[roundIndex];
        const infectedCities = App.getInfectedCities(state);
        const diff = App.getDifference(infectedCities, currentRound);

        const knownRemaining = App.getTotalCount(diff);
        if (knownRemaining <= 0) {
            // Equal probability with initial count
            return App.getProbabilities(App.getDifference(state.infectionDeck, currentRound));
        } else {
            return App.getProbabilities(diff);
        }
    }

    constructor(props: {}) {
        super(props);

        this.state = {
            epidemic: false,
            infectionDeck: initialCities,
            rounds: [App.getInitialRound(initialCities)]
        };

        this.onEpidemic = this.onEpidemic.bind(this);
        this.onEpidemicCitySelected = this.onEpidemicCitySelected.bind(this);
        this.onInfectionDeckCountChanged = this.onInfectionDeckCountChanged.bind(this);
        this.onInfectionCityAdd = this.onInfectionCityAdd.bind(this);
        this.onRestore = this.onRestore.bind(this);
        this.onRoundCountChanged = this.onRoundCountChanged.bind(this);
    }

    public render() {
        return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <h1 className="App-title">Welcome to Pandemic Calculator</h1>
                </header>
                {
                    this.state.epidemic ?
                        <CitySelector
                            cities={Object.keys(this.state.infectionDeck)}
                            cityProbabilities={App.getProbabilities(App.getDifference(this.state.infectionDeck, this.currentRound()))}
                            onCitySelected={this.onEpidemicCitySelected}
                        />
                    :
                        <PandemicRounds
                            infectionDeck={this.state.infectionDeck}
                            cityProbabilities={App.getCityProbabilities(this.state)}
                            rounds={this.state.rounds}
                            onCountChanged={this.onInfectionDeckCountChanged}
                            onCityAdd={this.onInfectionCityAdd}
                            onEpidemic={this.onEpidemic}
                            onRestore={this.onRestore}
                            onRoundCountChanged={this.onRoundCountChanged}
                        />
                }
            </div>
        );
    }

    private onInfectionDeckCountChanged(city: string, count: number): void {
        this.setState((prevState: IAppState, props: {}) => {
            const newInfectionDeck = Object.assign({}, prevState.infectionDeck);
            newInfectionDeck[city] = count;

            return {
                infectionDeck: newInfectionDeck
            };
        });
    }

    private onInfectionCityAdd(city: string): void {
        this.setState((prevState: IAppState, props: {}) => {
            if (prevState.infectionDeck[city]) {
                return prevState;
            }

            const newInfectionDeck = Object.assign({}, prevState.infectionDeck);
            newInfectionDeck[city] = 0;

            for (const round of prevState.rounds) {
                round[city] = 0;
            }

            return {
                infectionDeck: newInfectionDeck,
                rounds: prevState.rounds
            };
        });
    }

    private onRoundCountChanged(roundIndex: number, city: string, count: number): void {
        this.setState((prevState: IAppState, props: {}) => {
            prevState.rounds[roundIndex][city] = count;

            return {
                rounds: prevState.rounds
            };
        });
    }

    private onEpidemic(): void {
        this.setState({
            epidemic: true
        });
    }

    private onRestore(): void {
        this.setState((prevState: IAppState, props: {}) => {
            prevState.rounds.pop();

            return {
                rounds: prevState.rounds
            }
        });
    }

    private onEpidemicCitySelected(city: string): void {
        if (!city) {
            return this.setState({
                epidemic: false
            });
        }

        this.setState((prevState: IAppState, props: {}) => {
            prevState.rounds[prevState.rounds.length - 1][city]++;
            prevState.rounds.push(App.getInitialRound(prevState.infectionDeck));

            return {
                epidemic: false,
                rounds: prevState.rounds
            };
        });
    }

    private currentRound(): {[city: string]: number} {
        return this.state.rounds[this.state.rounds.length - 1];
    }
}

export default App;

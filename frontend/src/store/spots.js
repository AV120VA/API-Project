// USE LATER
// import { csrfFetch } from "./csrf";
import { createSelector } from "reselect";

// headers shortcut

// const headers = {
//   "Content-type": "application/json",
// };

// Action Types

const LOAD_SPOTS = "spots/loadSpots";
const LOAD_SPOT_BY_ID = "spots/loadSpotById";

// Action Creators

const loadSpots = (spots) => {
  return {
    type: LOAD_SPOTS,
    spots,
  };
};

const loadSpotById = (spots) => {
  return {
    type: LOAD_SPOT_BY_ID,
    spots,
  };
};

// Thunks

export const getAllSpots = () => async (dispatch) => {
  const response = await fetch("/api/spots");

  if (response.ok) {
    const data = await response.json();
    const spots = data.Spots;
    dispatch(loadSpots(spots));
  } else {
    return await response.json();
  }
};

export const getSpotById = (spotId) => async (dispatch) => {
  const response = await fetch(`/api/spots/${spotId}`);
  const spot = await response.json();
  dispatch(loadSpotById(spot));
  return spot;
};
// Reducers

const initialState = {};

function spotsReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_SPOTS: {
      const newSpots = {};
      action.spots.forEach((spot) => {
        newSpots[spot.id] = spot;
      });
      return newSpots;
    }
    case LOAD_SPOT_BY_ID: {
      return { ...state, spotById: action.spots };
    }
    default:
      return state;
  }
}

// Selectors

export const selectSpots = (state) => state.spots;

export const selectAllSpots = createSelector([selectSpots], (spots) => {
  return spots ? Object.values(spots) : [];
});

export default spotsReducer;
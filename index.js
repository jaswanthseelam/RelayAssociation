import * as d3 from "d3";
import csv from "csvtojson";
import fs from "fs";

const filename = "slsprofile_updated@1.csv";
const outputFileName = filename.split(".")[0] + "_output.csv";
var sls = null;

if (filename.split(".").pop() == "csv") {
  await csv()
    .fromFile(filename)
    .then((jsonArrayObj) => {
      sls = jsonArrayObj;
      const OutdoorUsers1 = OutdoorUsers_();
    });
} else {
  let raw = fs.readFileSync(filename);
  sls = JSON.parse(raw);
}

function OutdoorUsers_() {
  var res = [];
  var obj = sls.filter((arg) => arg.Indoor == 0);
  for (var i = 0; i < obj.length; i++) {
    res.push({
      RxNodeID: obj[i].RxNodeID,
      Conn_Cell_ID: obj[i].Conn_Cell_ID,
      Gcell_ID: obj[i].Gcell_ID,
      X_Rx: obj[i].X_Rx,
      Y_Rx: obj[i].Y_Rx,
      X_Tx: obj[i].X_Tx,
      Y_Tx: obj[i].Y_Tx,
      BestSINR: obj[i].BestSINR,
      RSSI: obj[i].RSSI,
      BestRSRP: obj[i].BestRSRP,
      Angles: obj[i].Angles,
      Indoor: obj[i].Indoor,
    });
  }
  return res;
}
const OutdoorUsers = OutdoorUsers_();

function UE_IndoorType_() {
  var res = [];
  for (var i = 0; i < sls.length; i++) {
    res.push(sls[i].Indoor);
  }
  return res;
}
const UE_IndoorType = UE_IndoorType_();
//console.log(UE_IndoorType)
let MinSINR = 10;
function PossibleSINRRelays_(MinSINR) {
  var obj = OutdoorUsers.filter((arg) => arg.BestSINR > MinSINR);
  return obj;
}
const PossibleSINRRelays = PossibleSINRRelays_(MinSINR);
// console.log(PossibleSINRRelays)

function Relays_ConnCell_2D_() {
  var res = [];
  for (var rows = 0; rows < 19; rows++) {
    res.push([]);
  }
  for (var cell = 0; cell < 19; cell++) {
    res[cell] = PossibleSINRRelays.filter((arg) => arg.Conn_Cell_ID == cell);
  }
  return res;
}
const Relays_ConnCell_2D = Relays_ConnCell_2D_();
//console.log(Relays_ConnCell_2D)
function Relays_ConnCell_1D_() {
  var res = [];
  for (var i = 0; i < 19; i++) {
    for (var j = 0; j < Relays_ConnCell_2D[i].length; j++) {
      res.push(Relays_ConnCell_2D[i][j]);
    }
  }
  return res;
}
const Relays_ConnCell_1D = Relays_ConnCell_1D_();
// console.log(Relays_ConnCell_1D)

function randomUniqueNum(range, outputCount) {
  let arr = [];
  for (let i = 1; i <= range; i++) {
    arr.push(i);
  }
  var result = [];
  for (let i = 1; i <= outputCount; i++) {
    const random = Math.floor(Math.random() * (range - i));
    result.push(arr[random]);
    arr[random] = arr[range - i];
  }
  return result;
}

let Nrelays = 10;
function PickRelays_ConnCell_(Nrelays) {
  var res = [];
  for (var cellID = 0; cellID < 19; cellID++) {
    var ues_inCell = Relays_ConnCell_1D.filter(
      (arg) => arg.Conn_Cell_ID == cellID
    );
    var L = ues_inCell.length;
    var indexes = Array.from(randomUniqueNum(L - 1, Nrelays));
    var relayids = d3.map(indexes, (i) => ues_inCell[i]);
    res.push(relayids);
  }
  return res;
}
const identifyRelays_ConnCell = PickRelays_ConnCell_(Nrelays);
// console.log(identifyRelays_ConnCell)

function identifyRelays_RxNodeIDs_() {
  var res = [];
  for (var rows = 0; rows < 19; rows++) {
    res.push([]);
  }
  for (var j = 0; j < 19; j++) {
    for (var i = 0; i < Nrelays; i++) {
      res[j].push(identifyRelays_ConnCell[j][i].RxNodeID);
    }
  }
  return res;
}
const identifyRelays_RxNodeIDs = identifyRelays_RxNodeIDs_();
//console.log(identifyRelays_ConnCell)

function identifyRelays_ConnCell_1D_() {
  var res = [];
  for (var i = 0; i < 19; i++) {
    for (var j = 0; j < Nrelays; j++) {
      res.push(identifyRelays_ConnCell[i][j]);
    }
  }
  return res.sort();
}
const identifyRelays_ConnCell_1D = identifyRelays_ConnCell_1D_();
// console.log(identifyRelays_ConnCell)

function RelayIDs_() {
  var res = [];
  for (var i = 0; i < identifyRelays_ConnCell_1D.length; i++) {
    res.push(identifyRelays_ConnCell_1D[i].RxNodeID);
  }
  return res;
}
const RelayIDs = RelayIDs_();
//console.log(RelayIDs)

function identifyDevices_() {
  var res = [];
  /*for (var rows = 0; rows < 57; rows++) {
      res.push([]);
    }*/
  for (var i = 0; i < sls.length; i++) {
    if (RelayIDs.includes(sls[i].RxNodeID)) continue;
    else res.push(sls[i]);
  }
  return res;
}

const identifyDevices = identifyDevices_();
//console.log(identifyDevices)

function random_Channel() {
  return [2, 2, 3, 3, 4, 4, 5, 5][Math.floor(Math.random() * 8)];
}
function Random_ChannelAssg_() {
  var res = [];
  for (var rows = 0; rows < 19; rows++) {
    res.push([]);
  }
  var Channel;
  for (var i = 0; i < 19; i++) {
    for (var j = 0; j < identifyRelays_ConnCell[i].length; j++) {
      Channel = random_Channel();
      res[i].push({
        ...identifyRelays_ConnCell[i][j],
        Channel: Channel,
      });
    }
  }
  return res;
}
const Random_ChannelAssg = Random_ChannelAssg_();
//console.log(Random_ChannelAssg)

function RandomChannelAssgn_1D_() {
  var res = [];
  for (var i = 0; i < 19; i++) {
    for (var j = 0; j < Nrelays; j++) {
      res.push(Random_ChannelAssg[i][j]);
    }
  }
  return res;
}
const RandomChannelAssgn_1D = RandomChannelAssgn_1D_();
//console.log(RandomChannelAssgn_1D)

function CountChannels_() {
  var count2 = 0;
  var count3 = 0;
  var count4 = 0;
  var count5 = 0;
  for (var i = 0; i < 19 * Nrelays; i++) {
    if (RandomChannelAssgn_1D[i].Channel == 2) count2 += 1;
    if (RandomChannelAssgn_1D[i].Channel == 3) count3 += 1;
    if (RandomChannelAssgn_1D[i].Channel == 4) count4 += 1;
    if (RandomChannelAssgn_1D[i].Channel == 5) count5 += 1;
  }
  return {
    Channel2: count2,
    Channel3: count3,
    Channel4: count4,
    Channel5: count5,
  };
}
const CountChannels = CountChannels_();
//console.log(CountChannels)

function linkprop_relays_() {
  var res = [];
  for (var rows = 0; rows < identifyDevices.length; rows++) {
    res.push([]);
  }
  var TxPower = 23;
  for (var i = 0; i < identifyDevices.length; i++) {
    for (var j = 0; j < RandomChannelAssgn_1D.length; j++) {
      var Distance2D = d2D_Relay(identifyDevices[i], RandomChannelAssgn_1D[j]);
      var LOS = isLOS(Distance2D);
      var PathLoss = pathloss(Distance2D, LOS);
      var O2ILoss = o2i(Distance2D, 0, "NA");
      var CouplingLoss = couplingLoss(PathLoss, O2ILoss);
      res[i].push({
        DeviceID: identifyDevices[i].RxNodeID,
        RelayID: RandomChannelAssgn_1D[j].RxNodeID,
        Channel: RandomChannelAssgn_1D[j].Channel,
        d2D: Distance2D,
        isLOS: LOS,
        pathloss: PathLoss,
        o2i: O2ILoss,
        CouplingLoss: CouplingLoss,
        RxPower: CouplingLoss + TxPower,
      });
    }
  }
  return res;
}
const linkprop_relays = linkprop_relays_();
//console.log(linkprop_relays)

function linkprop_relays_1D_() {
  var res = [];
  for (var i = 0; i < identifyDevices.length; i++) {
    for (var j = 0; j < RandomChannelAssgn_1D.length; j++) {
      res.push(linkprop_relays[i][j]);
    }
  }
  return res;
}
const linkprop_relays_1D = linkprop_relays_1D_();
//console.log(linkprop_relays_1D)

function MaxRxPower_() {
  var RxPower_Arr = [];
  var res = [];
  for (var rows = 0; rows < linkprop_relays.length; rows++) {
    RxPower_Arr.push([]);
  }
  for (var i = 0; i < linkprop_relays.length; i++) {
    for (var j = 0; j < 190; j++) {
      RxPower_Arr[i].push(linkprop_relays[i][j].RxPower);
    }
  }
  for (var k = 0; k < linkprop_relays.length; k++) {
    var Maximum = Math.max(...RxPower_Arr[k]);
    var link_obj = linkprop_relays[k].find((arg) => arg.RxPower == Maximum);
    res.push(link_obj);
  }
  return res;
}
const MaxRxPower = MaxRxPower_();
//console.log(MaxRxPower)

function SINR_linkprop_() {
  var Noise_db = -104.625;
  var Noise_lin = Math.pow(10, Noise_db / 10);
  var SINR_dB = [];
  var res = [];
  for (var a = 0; a < linkprop_relays.length; a++) {
    var BestRxPower_RelayID = MaxRxPower[a].RelayID;
    var BestRxPower_dB = MaxRxPower[a].RxPower;
    var BestRxPower_lin = Math.pow(10, BestRxPower_dB / 10);
    var alloc_Channel = MaxRxPower[a].Channel;
    var interference_lin = 0;
    //var count = 0;
    for (var i = 0; i < 190; i++) {
      if (linkprop_relays[a][i].Channel != alloc_Channel) continue;
      else {
        //count += 1;
        var RxPower_lin = Math.pow(10, linkprop_relays[a][i].RxPower / 10);
        interference_lin = interference_lin + RxPower_lin;
      }
    }
    interference_lin = interference_lin - BestRxPower_lin;
    var SINR_lin = BestRxPower_lin / (interference_lin + Noise_lin);
    var SINR_dB = 10 * Math.log10(Math.abs(SINR_lin));
    res.push({
      DeviceID: MaxRxPower[a].DeviceID,
      BestSINR_dB: SINR_dB,
      BestSINR_lin: SINR_lin,
      Channel: alloc_Channel,
    });
  }
  return res;
}
const SINR_linkprop = SINR_linkprop_();
//console.log(SINR_linkprop)

function MaxRxPower_4Channels_() {
  var RxPower2_Arr = [];
  var RxPower3_Arr = [];
  var RxPower4_Arr = [];
  var RxPower5_Arr = [];
  var res = [];
  //Creates 2D empty arrays of size (18810 x 0)
  for (var rows = 0; rows < linkprop_relays.length; rows++) {
    RxPower2_Arr.push([]); //Creates 2D array where each row will further get all the RxPower values associated with channel 2 for 1 device.
    RxPower3_Arr.push([]);
    RxPower4_Arr.push([]);
    RxPower5_Arr.push([]);
    res.push([]);
  }
  for (var i = 0; i < identifyDevices.length; i++) {
    for (var j = 0; j < 190; j++) {
      if (linkprop_relays[i][j].Channel == 2) {
        RxPower2_Arr[i].push(linkprop_relays[i][j].RxPower); //Has all the RxPowers for a device-relay link for Channel 2 of particular device
      }
      if (linkprop_relays[i][j].Channel == 3) {
        RxPower3_Arr[i].push(linkprop_relays[i][j].RxPower); //Has all the RxPowers for a device-relay link for Channel 3 of particular device
      }
      if (linkprop_relays[i][j].Channel == 4) {
        RxPower4_Arr[i].push(linkprop_relays[i][j].RxPower); //Has all the RxPowers for a device-relay link for Channel 4 of particular device
      }
      if (linkprop_relays[i][j].Channel == 5) {
        RxPower5_Arr[i].push(linkprop_relays[i][j].RxPower); //Has all the RxPowers for a device-relay link for Channel 5 of particular device
      }
    }
  }
  for (var k = 0; k < identifyDevices.length; k++) {
    var Maximum2 = Math.max(...RxPower2_Arr[k]); //Gets the maximum value of associated channel2 from RxPower2_Arr[k] for kth device
    var Maximum3 = Math.max(...RxPower3_Arr[k]); //Gets the maximum value of associated channel3 from RxPower3_Arr[k] for kth device
    var Maximum4 = Math.max(...RxPower4_Arr[k]); //Gets the maximum value of associated channel4 from RxPower4_Arr[k] for kth device
    var Maximum5 = Math.max(...RxPower5_Arr[k]); //Gets the maximum value of associated channel5 from RxPower5_Arr[k] for kth device

    var link_obj2 = linkprop_relays[k].find((arg) => arg.RxPower == Maximum2);
    //Traces back and finds the associated link for kth device from linkprop_relay based on Maximum2
    var link_obj3 = linkprop_relays[k].find((arg) => arg.RxPower == Maximum3);
    var link_obj4 = linkprop_relays[k].find((arg) => arg.RxPower == Maximum4);
    var link_obj5 = linkprop_relays[k].find((arg) => arg.RxPower == Maximum5);

    res[k].push(link_obj2, link_obj3, link_obj4, link_obj5);
  }
  return res;
}

const MaxRxPower_4Channels = MaxRxPower_4Channels_();
//console.log(MaxRxPower_4Channels)

function SINR_4Channels_() {
  var Noise_db = -104.625;
  var Noise_lin = Math.pow(10, Noise_db / 10);
  var SINR_dB = [];
  var res = [];
  for (var a = 0; a < linkprop_relays.length; a++) {
    var BestRxPower2_RelayID = MaxRxPower_4Channels[a][0].RelayID;
    var BestRxPower3_RelayID = MaxRxPower_4Channels[a][1].RelayID;
    var BestRxPower4_RelayID = MaxRxPower_4Channels[a][2].RelayID;
    var BestRxPower5_RelayID = MaxRxPower_4Channels[a][3].RelayID;
    var BestRxPower2_dB = MaxRxPower_4Channels[a][0].RxPower;
    var BestRxPower3_dB = MaxRxPower_4Channels[a][1].RxPower;
    var BestRxPower4_dB = MaxRxPower_4Channels[a][2].RxPower;
    var BestRxPower5_dB = MaxRxPower_4Channels[a][3].RxPower;

    var BestRxPower2_lin = Math.pow(10, BestRxPower2_dB / 10);
    var BestRxPower3_lin = Math.pow(10, BestRxPower3_dB / 10);
    var BestRxPower4_lin = Math.pow(10, BestRxPower4_dB / 10);
    var BestRxPower5_lin = Math.pow(10, BestRxPower5_dB / 10);

    var interference2_lin = 0;
    var interference3_lin = 0;
    var interference4_lin = 0;
    var interference5_lin = 0;

    for (var i = 0; i < 19 * Nrelays; i++) {
      if (linkprop_relays[a][i].Channel == 2) {
        var RxPower2_lin = Math.pow(10, linkprop_relays[a][i].RxPower / 10);
        interference2_lin = interference2_lin + RxPower2_lin;
      }
      if (linkprop_relays[a][i].Channel == 3) {
        var RxPower3_lin = Math.pow(10, linkprop_relays[a][i].RxPower / 10);
        interference3_lin = interference3_lin + RxPower3_lin;
      }
      if (linkprop_relays[a][i].Channel == 4) {
        var RxPower4_lin = Math.pow(10, linkprop_relays[a][i].RxPower / 10);
        interference4_lin = interference4_lin + RxPower4_lin;
      }
      if (linkprop_relays[a][i].Channel == 5) {
        var RxPower5_lin = Math.pow(10, linkprop_relays[a][i].RxPower / 10);
        interference5_lin = interference5_lin + RxPower5_lin;
      }
    }
    interference2_lin = interference2_lin - BestRxPower2_lin;
    interference3_lin = interference3_lin - BestRxPower3_lin;
    interference4_lin = interference4_lin - BestRxPower4_lin;
    interference5_lin = interference5_lin - BestRxPower5_lin;

    var SINR_lin_2 = BestRxPower2_lin / (interference2_lin + Noise_lin);
    var SINR_dB_2 = 10 * Math.log10(Math.abs(SINR_lin_2));

    var SINR_lin_3 = BestRxPower3_lin / (interference3_lin + Noise_lin);
    var SINR_dB_3 = 10 * Math.log10(Math.abs(SINR_lin_3));

    var SINR_lin_4 = BestRxPower4_lin / (interference4_lin + Noise_lin);
    var SINR_dB_4 = 10 * Math.log10(Math.abs(SINR_lin_4));

    var SINR_lin_5 = BestRxPower5_lin / (interference5_lin + Noise_lin);
    var SINR_dB_5 = 10 * Math.log10(Math.abs(SINR_lin_5));

    res.push({
      DeviceID: MaxRxPower[a].DeviceID,
      RelayID_2: BestRxPower2_RelayID,
      BestSINR_2_dB: SINR_dB_2,
      RelayID_3: BestRxPower3_RelayID,
      BestSINR_3_dB: SINR_dB_3,
      RelayID_4: BestRxPower4_RelayID,
      BestSINR_4_dB: SINR_dB_4,
      RelayID_5: BestRxPower5_RelayID,
      BestSINR_5_dB: SINR_dB_5,
    });
  }
  return res;
}

const SINR_4Channels = SINR_4Channels_();
//console.log(SINR_4Channels)

function SINR_4Channels_BS_() {
  var res = [];
  for (var i = 0; i < identifyDevices.length; i++) {
    res.push({
      ...SINR_4Channels[i],
      SINR_BS: identifyDevices[i].BestSINR,
      BaseStationID: identifyDevices[i].BestRSRPNode,
    });
  }
  return res;
}
const SINR_4Channels_BS = SINR_4Channels_BS_();
//console.log(SINR_4Channels)

function Best_() {
  var res = [];
  var arr = [];
  var RelayID;
  for (var i = 0; i < identifyDevices.length; i++) {
    arr = [];
    arr.push(
      SINR_4Channels_BS[i].BestSINR_2_dB,
      SINR_4Channels_BS[i].BestSINR_3_dB,
      SINR_4Channels_BS[i].BestSINR_4_dB,
      SINR_4Channels_BS[i].BestSINR_5_dB,
      SINR_4Channels_BS[i].SINR_BS
    );
    var Maximum = Math.max(...arr);
    if (Maximum == SINR_4Channels_BS[i].BestSINR_2_dB) {
      RelayID = SINR_4Channels_BS[i].RelayID_2;
    }
    if (Maximum == SINR_4Channels_BS[i].BestSINR_3_dB) {
      RelayID = SINR_4Channels_BS[i].RelayID_3;
    }
    if (Maximum == SINR_4Channels_BS[i].BestSINR_4_dB) {
      RelayID = SINR_4Channels_BS[i].RelayID_4;
    }
    if (Maximum == SINR_4Channels_BS[i].BestSINR_5_dB) {
      RelayID = SINR_4Channels_BS[i].RelayID_5;
    }
    if (Maximum == SINR_4Channels_BS[i].SINR_BS) {
      RelayID = SINR_4Channels_BS[i].BaseStationID;
    }
    res.push({
      DeviceID: identifyDevices[i].RxNodeID,
      BestSINR: Maximum,
      CorrespondingRelay_BS: RelayID,
    });
  }
  return res;
}
const Best = Best_();
//console.log(Best)

function LessThanZero_Best_Check_() {
  var res = [];
  for (var i = 0; i < Best.length; i++) {
    res = Best.filter((arg) => arg.BestSINR < 0);
  }
  return res;
}
const LessThanZero = LessThanZero_Best_Check_();
//console.log(LessThanZero)

let arrayToCSV = (array) => {
  let a = [Object.keys(array[0])].concat(array);
  let x = a
    .map((i) => {
      return Object.values(i).toString();
    })
    .join("\n");
  return x;
};
// console.log(arrayToCSV(Best))
let outputData = arrayToCSV(Best);

fs.writeFile(outputFileName, outputData, (err) => {
  if (err) console.log(err);
});

function hop_() {
  var res = [];
  //var arr = [];
  var RelayID;
  var BestResult;
  for (var i = 0; i < Best.length; i++) {
    var SINR = Best[i].BestSINR;
    var RelayID = Best[i].CorrespondingRelay_BS;
    if (Best[i].CorrespondingRelay_BS <= 383) BestResult = SINR;
    else {
      var obj = identifyRelays_ConnCell_1D.filter(
        (arg) => arg.RxNodeID == RelayID
      );
      var Relay_BS_SINR = obj[0].BestSINR;
      if (Relay_BS_SINR < SINR) BestResult = Relay_BS_SINR;
      else BestResult = SINR;
    }
    res.push({
      DeviceID: identifyDevices[i].RxNodeID,
      BestSINR: BestResult,
    });
  }
  return res;
}
const hop = hop_();
//console.log(hop)

//LOSS FUNCTIONS
function d2D(device, bs) {
  var dis;
  dis = Math.pow(
    Math.pow(device.X_Rx - bs.X_Tx, 2) + Math.pow(device.Y_Rx - bs.Y_Tx, 2),
    0.5
  );
  return dis;
}

function d2D_Relay(device, relay) {
  var dis;
  dis = Math.pow(
    Math.pow(device.X_Rx - relay.X_Rx, 2) +
      Math.pow(device.Y_Rx - relay.Y_Rx, 2),
    0.5
  );
  return dis;
}

function isLOS(distance) {
  var threshold = 0.5; //ToFindTheRightOne
  var i = 0;
  if (Math.abs(distance) <= 18) return true;
  else {
    var prob =
      18 / Math.abs(distance) +
      Math.exp((-Math.abs(distance) / 36) * (1 - 18 / Math.abs(distance)));
    if (prob < threshold) return true;
    else return false;
  }
}

function pathloss(distance, LOScheck, forO2I = 0) {
  var fc = 0.7; //fc is in GHz
  var c = 3 * Math.pow(10, 8); //m/sec
  var hUT = 1.5; //1.5m
  var hBS = 10; //height_BS
  var hE = 1; //For UMi hE = 1.0m.For UMa hE=1m with a probability equal to 1/(1+C(d2D, hUT))
  var hUE = 1.5;
  var hBS_dash = hBS - hUE; //0
  var hUT_dash = hUT - hUE; //0
  var dBP_dash = (4 * hUT_dash * hBS_dash * (fc * Math.pow(10, 9))) / c; //0
  var res_LOSpathloss;
  var res_NLOSpathloss;
  var res = [];
  var i = 0; //can be removed while generalizing
  var PLnlos_dash =
    35.3 * Math.log10(distance) +
    22.4 +
    21.3 * Math.log10(fc) -
    0.3 * (hUT - 1.5);
  var d2D = distance;
  var d3D = d2D;
  var d3D_O2I = Math.pow(
    Math.pow(distance, 2) + Math.pow(hBS_dash - hUT, 2),
    0.5
  );
  //Condition to Check Indoor or Outdoor
  if (forO2I == 1) {
    if (d2D < dBP_dash) {
      //where is the lower bound??
      var PL_LOS = 32.4 + 21 * Math.log10(d3D_O2I) + 20 * Math.log10(fc);
      var PL_NLOS = Math.max(PL_LOS, PLnlos_dash);
      res_LOSpathloss = PL_LOS;

      res_NLOSpathloss = PL_NLOS;
      //res.push(PL_LOS, PL_NLOS);
    }
    if (d2D >= dBP_dash) {
      var PL_LOS =
        32.4 +
        40 * Math.log10(d3D_O2I) +
        20 * Math.log10(fc) -
        9.5 * Math.log10(Math.pow(dBP_dash, 2) + Math.pow(hBS - hUT, 2));
      var PL_NLOS = Math.max(PL_LOS, PLnlos_dash);
      res_LOSpathloss = PL_LOS;
      res_NLOSpathloss = PL_NLOS;
    }
  } else {
    if (d2D < dBP_dash) {
      var PL_LOS = 32.4 + 21 * Math.log10(d3D) + 20 * Math.log10(fc);
      var PL_NLOS = Math.max(PL_LOS, PLnlos_dash);
      res_LOSpathloss = PL_LOS;

      res_NLOSpathloss = PL_NLOS;
      //res.push(PL_LOS, PL_NLOS);
    }
    if (d2D >= dBP_dash) {
      var PL_LOS =
        32.4 +
        40 * Math.log10(d3D) +
        20 * Math.log10(fc) -
        9.5 * Math.log10(Math.pow(dBP_dash, 2) + Math.pow(hBS - hUT, 2));
      var PL_NLOS = Math.max(PL_LOS, PLnlos_dash);
      res_LOSpathloss = PL_LOS;
      res_NLOSpathloss = PL_NLOS;
    }
  }
  if (LOScheck == true) return res_LOSpathloss;
  else return res_NLOSpathloss;
}

function o2i(distance, LOScheck, lossType) {
  if (lossType == "NA") return 0;
  else {
    var f = 0.7;
    var PL_b = pathloss(distance, LOScheck, 1);
    var Lglass = 2 + 0.2 * f;
    var Liirglass = 23 + 0.3 * f;
    var Lconcrete = 5 + 4 * f;
    var Lwood = 4.85 + 0.12 * f;

    var Resultant_O2I;

    var d2D_in = Math.min(Math.random() * 25, Math.random() * 25);
    var PLin = 0.5 * d2D_in; //Should d2D be taken as distance[i] like earlier cases?
    if (lossType == "0") {
      var sigmaP_low = 4.4;
      var PLtw_low =
        5 -
        10 *
          Math.log10(
            0.3 * Math.pow(10, -Lglass / 10) +
              0.7 * Math.pow(10, -Lconcrete / 10)
          );
      Resultant_O2I =
        parseFloat(PL_b) + PLtw_low + PLin + d3.randomNormal(0, sigmaP_low)();
    } else {
      var sigmaP_high = 6.5;

      var PLtw_high =
        5 -
        10 *
          Math.log10(
            0.7 * Math.pow(10, -Liirglass / 10) +
              0.3 * Math.pow(10, -Lconcrete / 10)
          );
      Resultant_O2I =
        parseFloat(PL_b) + PLtw_high + PLin + d3.randomNormal(0, sigmaP_high)();
    }
    return Resultant_O2I;
  }
}

function couplingLoss(pathloss, o2i) {
  return -(pathloss + o2i);
}
//const data=Best
//console.log(data)
//   function download_csv() {
//     var csv = 'Best_FinalResult\n';
//     data.forEach(function(row) {
//             csv += row.join(',');
//             csv += "\n";
//     });

//     console.log(csv);
//     var hiddenElement = document.createElement('a');
//     hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
//     hiddenElement.target = '_blank';
//     hiddenElement.download = 'people.csv';
//     hiddenElement.click();
// }
// download_csv()

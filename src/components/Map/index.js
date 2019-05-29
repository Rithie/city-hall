import React, { Component, Fragment } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";

import { Camera, Permissions, ImagePicker } from 'expo';

import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import Geocoder from "react-native-geocoding";
import { Ionicons } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/Feather';
import io from 'socket.io-client';

import {MapStyle} from './mapStyle'

import {
  Back,
  LocationBox,
  LocationText,
  LocationTimeBox,
  LocationTimeText,
  LocationTimeTextSmall
} from "./styles";

Geocoder.init("AIzaSyB1O8amubeMkw_7ok2jUhtVj9IkME9K8sc");

import * as firebase from 'firebase';

const config = {
        apiKey: "AIzaSyBzwl-VNc2nwwT5l1OmUTR_WSEdhTmbw6k",
        authDomain: "cityhalltracker.firebaseapp.com",
        databaseURL: "https://cityhalltracker.firebaseio.com",
        projectId: "cityhalltracker",
        storageBucket: "cityhalltracker.appspot.com",
        messagingSenderId: "156041412588"
      };

const statusColor = (status) => {
  switch(status){
    case 1:
      return '#8bc34a'
    case 2:
      return '#ffeb3b'
    case 3:
      return '#e0393e'
    default:
      return '#e8e4e4'

  }
}
export default class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      region: null,
      destination: null,
      duration: null,
      location: null,
      issues: [],
      modalVisible: false,
      hasCameraPermission: null,
      type: Camera.Constants.Type.back,
      image: null,
      showMarker: false,
    };
    this.socket = io('http://10.0.0.108:3000')
    this.socket.emit("action", {
      type:"BOOKING_CONFIRMEDS"
    })
    this.socket.on('update', function (data) {
      console.log('client connect2', data);
    });
  }

  async componentDidMount() {
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }

    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    const { status2 } = await Permissions.getAsync(Permissions.CAMERA_ROLL);
    this.setState({ hasCameraPermission: status === 'granted' });

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        const response = await Geocoder.from({ latitude, longitude });
        const address = response.results[0].formatted_address;
        const location = address.substring(0, address.indexOf(","));
        
        this.setState({
          location,
          region: {
            latitude,
            longitude,
            latitudeDelta: 0.0143,
            longitudeDelta: 0.0134
          }
        });
      }, //sucesso
      () => {}, //erro
      {
        timeout: 2000,
        enableHighAccuracy: true,
        maximumAge: 1000
      }
    );
    this.getMessages();
  }

  setModalVisible(visible) {
    this.setState({modalVisible: visible});
  }

  // socket

  _handleHelpPress = () => {
    const { region, location } = this.state;
    //io.emit("request-trip", { name: 'jovem', id: '1d33s34ge'});
    this.socket.emit("driver-msg", {
      type:"STATUS_ONLINE",
      region,
      location,
    })
    console.log('client connect3');
  };

  //camera

  snap = async () => {
    if (this.camera) {
      let photo = await this.camera.takePictureAsync();
     
      this.setState({ image: photo.uri });
       //this._pickImage()
    }
  };

  renderCamera = () => {
    const { hasCameraPermission } = this.state;
    if (hasCameraPermission === null) {
      return <View />;
    } else if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>;
    } else {
      return (
        <View style={{ flex: 1 }}>
          <View
            style={{
              width: '100%',
              height: 70,
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 100,
              backgroundColor: '#000',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16
            }}
          >
            <TouchableOpacity
              onPress={() => {
                this.setModalVisible(!this.state.modalVisible);
              }}
            >
              <Ionicons
                name="ios-close" size={50} color="#fff"
              />
            </TouchableOpacity>
            <View />
            <View />
          </View>
          <Image
            style={{
              width: 256,
              height: 256,
              position: 'absolute',
              opacity: 0.2,
              zIndex: 100,
              top: '30%',
              alignSelf: 'center'
            }}
            source={require('../../assets/camera.png')}
          />
          <Camera
            style={{ flex: 1 }}
            type={this.state.type}
            ref={ref => { this.camera = ref; }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                flexDirection: 'row',
              }}>   
            </View>
            <View
            
            style={{
              alignSelf: 'flex-end',
              backgroundColor: '#09091A',
              height: 80,
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: 'row',
              paddingHorizontal: 10
            }}>
            <TouchableOpacity
              onPress={() => {
                this.setState({
                  type: this.state.type === Camera.Constants.Type.back
                    ? Camera.Constants.Type.front
                    : Camera.Constants.Type.back,
                });
              }}
            >
              <Ionicons
                name="ios-reverse-camera" size={50} color="#fff"
              />
            </TouchableOpacity>
              <TouchableOpacity
                onPress={this.snap}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 60,
                  backgroundColor: '#fff',
                  alignItems: "center",
                  justifyContent: 'center',
                  margin: 10,
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 50,
                    backgroundColor:'#fff',
                    borderWidth:2,
                    borderColor: '#000'
                  }}
                />
              </TouchableOpacity>
              {
                this.state.image ?
                  <View
                    style={{
                    borderWidth: 1,
                    borderColor: '#fff',
                    alignSelf: 'center',
                    alignItems: 'center',
                    height: 60, width: 60, 
                  }}
                >
                  <Image
                    source={{ uri: this.state.image }}
                    resizeMode="contain"
                    style={{ height: 60, width: 60, resizeMode: 'contain' }}
                  />
                </View>
                :
                <Ionicons
                  name="ios-images" size={50} color="#fff"
                />
              }
          </View>
          </Camera>
        </View>
      );
    }
  }

  _pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
    });

    console.log(result);

    if (!result.cancelled) {
      this.setState({ image: result.uri });
    }
  };
  // fim camera

  handleLocationSelected = (data, { geometry }) => {
    const {
      location: { lat: latitude, lng: longitude }
    } = geometry;

    this.setState({
      destination: {
        latitude,
        longitude,
        title: data.structured_formatting.main_text
      }
    });
  };

  handleBack = () => {
    this.setState({ destination: null });
  };

  onRegionChange = async (region) => {

    const response = await Geocoder.from({ latitude: region.latitude, longitude: region.longitude });
        const address = response.results[0].formatted_address;
        const location = address.substring(0, address.indexOf(","));
        console.log('location', location)
  }

  getMessages = async () => {
    let message_array = [];
        await firebase.database().ref('places').on('child_added', async (snapshot) => {

          let message_id = await snapshot.key;    
          await message_array.push(snapshot.val())

          this.setState({ issues: message_array});
        })
  }

  centerMap = () => {
    _mapView.animateToCoordinate({
        latitude: this.state.region.latitude, 
        longitude: this.state.region.longitude
      }, 500)
  }

  renderIcon = (code) => {
    switch(code){
      case 1:
        return (
          <Image
            source={require('../../assets/pipe.png')}
          />
      )
      case 2:
        return (
          <Image
            source={require('../../assets/train.png')}
          />
      )
      case 3:
        return (
          <Image
            source={require('../../assets/garbage.png')}
          />
        )
      case 4:
      return (
        <Image
          source={require('../../assets/support.png')}
        />
      )
      case 5:
        return (
          <Image
            source={require('../../assets/tools-and-utensils.png')}
          />
        )
      case 6:
        return (
          <Image
            source={require('../../assets/digger.png')}
          />
        )
      case 7:
        return (
          <Image
            source={require('../../assets/excavator.png')}
          />
        )
      default:
      return(
        <Image
          style={{width: 50, height: 50}}
          source={{uri: 'https://facebook.github.io/react-native/docs/assets/favicon.png'}}
        />
      )
    }
  }

  toggleMarker(){
    this.setState({
      showMarker: !this.state.showMarker,
    })
  }

  render() {
    const { showMarker, region, destination, duration, location, issues } = this.state;

    return (
      <View style={{ flex: 1 }}>
        <MapView       
          provider={PROVIDER_GOOGLE}
          customMapStyle={MapStyle}
          style={{ flex: 1 }}
          region={region}
          showsUserLocation
          loadingEnabled
          onRegionChangeComplete={this.onRegionChange}
          ref = {(mapView) => { _mapView = mapView; }}
        >

            <Fragment>
              {
                showMarker &&
                <Ionicons
                  style={styles.mappin}
                  name="ios-pin" size={40} color="#010002"
                />
              }
              { issues && issues.map(issues => (
                <Marker
                  key={issues.lat}
                  coordinate={
                  {
                    latitude: issues.lat, 
                    longitude: issues.long
                  }
                } 
                anchor={{ x: 0, y: 0 }}
                ref={_marker => {
                  this.marker = _marker;
                }}
                onPress={() => {
                  
                  _mapView.animateToCoordinate({
                    latitude: issues.lat, 
                    longitude: issues.long
                  }
                  ,300)
                  
                }}
                onCalloutPress={() => {
                  this.marker.hideCallout();
                }}>
          
                {
                    this.renderIcon(issues.type)
                  }

                <Callout
                  tooltip={true}>
                      <LocationBox>
                  <LocationTimeBox>
                  <Image

                    ImageResizeMode="contain"
                    style={{minWidth: 90, height: 70}}
                    source={{uri: 'https://jornalggn.com.br/sites/default/files/u16-2016/fotorburacorua.jpg'}}
                  />
                  </LocationTimeBox>
                  <View
                    style={{
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'center',
                      width: 150,
                      borderRightWidth: 3,
                      borderRightColor: statusColor(issues.status)
                    }}>
                    <LocationText bold>{issues.description}</LocationText> 
                    <LocationText>{location}</LocationText> 
                  </View>
                </LocationBox>
                </Callout>
              </Marker>
              )
              )}
            </Fragment>
        </MapView>
        <View>
          <Modal
            animationType="slide"
            transparent={false}
            visible={this.state.modalVisible}
            onRequestClose={() => {
              Alert.alert('Modal has been closed.');
            }}
          >
            <View style={{flex: 1}}>
              {
                this.renderCamera()
              }
            </View>
          </Modal>
        </View>
        <View style={styles.bottomMenu}>
          <TouchableOpacity
            onPress={this._handleHelpPress}
            style={styles.circularButton}
          >
            <Ionicons name="ios-menu" size={30} color="#535353" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              this.setModalVisible(true);
            }}
          >
            <Text style={styles.paragraph}>
              INFORMAR
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.circularButton}
            onPress={this.centerMap}
          >
            <Icon name="crosshair" size={30} color="#535353" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
   // paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
  },
  mappin: {
    position: 'absolute',
    top: '50%',
    left: '50%'
  },
  bottomMenu: {
   backgroundColor: '#f9f9f9',
   height: 80,
   zIndex: 50,
   shadowOffset:{  width: 1,  height: 1,  },
  shadowColor: '#999',
  shadowOpacity: 1.0,
  justifyContent: 'space-between',
  alignItems: 'center',
  flexDirection: 'row',
  paddingHorizontal: 16
  },
  paragraph: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white'
  },
  circularButton: {
    borderRadius: 25,
    width: 50,
    height: 50,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
     shadowOffset:{  width: 1,  height: 1,  },
  shadowColor: '#999',
  shadowOpacity: 1.0,
  },
  button: {
    borderRadius: 30,
    width: 150,
    height: 50,
    backgroundColor: '#010002',
    justifyContent: 'center',
    alignItems: 'center'
  }
});

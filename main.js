const API_KEY = "4878467965626a6b34355851476d4e";

// await를 쓰려면 async를 선언해줘야 함.
const getData = async (curentLat, curentLng, localName) => {
  const url = `https://openapi.seoul.go.kr:8088/${API_KEY}/json/GetParkInfo/1/20/${localName}`;
  // console.log(url);
  // issue : 현재 서울 공공데이터 API에서 좌표 정보를 반환해주지 않고 있음. => 마커 표시 안됨. 주소 정보를 좌표 정보로 바꿔주는 로직 필요 (2023.4.10)

  // await를 쓰는 이유 : url을 받을 때까지 기다려줘라!
  const response = await fetch(url);
  const data = await response.json();
  const parkingInfo = data.GetParkInfo.row.map((el) => [
    {
      name: el.PARKING_NAME,
      addr: el.ADDR,
      tel: el.TEL,
      type: el.PARKING_TYPE_NM,
      rule: el.OPERATION_RULE_NM,
      pay: el.PAY_NM,
      add_time_rate: el.ADD_TIME_RATE,
      add_rates: el.ADD_RATES,
      lat: el.LAT,
      lng: el.LNG,
    },
  ]);
  // console.log(parkingInfo);

  // 위 로직으로부터 전달 받은 마커 좌표, 현재 위치 좌표를 drawMap 함수로 전달한다.
  drawMap(parkingInfo, curentLat, curentLng);
};

// 현재 위치 구하기
const currentLocation = (curentLat, curentLng) => {
  naver.maps.Service.reverseGeocode(
    {
      location: new naver.maps.LatLng(curentLat, curentLng),
    },
    function (status, response) {
      if (status !== naver.maps.Service.Status.OK) {
        return alert("Something wrong!");
      }

      var result = response.result, // 검색 결과의 컨테이너
        items = result.items; // 검색 결과의 배열
      localName = items[0].addrdetail.sigugun;
      // do Something
      getData(curentLat, curentLng, localName);
    }
  );
};
navigator.geolocation.getCurrentPosition(function (pos) {
  currentLocation(pos.coords.latitude, pos.coords.longitude);
});

// 맵 그리기 로직 시작
const drawMap = (parkingInfo, curentLat, curentLng) => {
  const map = new naver.maps.Map(document.getElementById("map"), {
    // 지도 option 설정
    center: new naver.maps.LatLng(curentLat, curentLng),
    zoom: 15,
  });
  const markers = [];
  const infoWindows = [];
  parkingInfo.forEach((el) => {
    // console.log(el[0].name, el[0].lat, el[0].lng);
    const location = new naver.maps.LatLng(el[0].lat, el[0].lng);
    const marker = new naver.maps.Marker({
      position: location,
      map: map,
      title: el[0].name,
      addr: el[0].addr,
      tel: el[0].tel,
      type: el[0].type,
      rule: el[0].rule,
      pay: el[0].pay,
      add_rates: el[0].add_rates,
      add_time_rate: el[0].add_time_rate,
      icon: {
        url: "img/marker.svg",
        size: new naver.maps.Size(50, 50),
        scaledSize: new naver.maps.Size(50, 50),
        origin: new naver.maps.Point(0, 0),
        anchor: new naver.maps.Point(25, 25),
      },
    });
    const infoWindow = new naver.maps.InfoWindow({
      content: `
      <div class="infoWindow">
        <p class="infoTitle">${marker.title}</p>
        <p class="infoP">주소 : ${marker.addr}</p>
        <p class="infoP">연락처 : ${marker.tel}</p>
        <p class="infoP">운영구분 : ${marker.rule}</p>
        <p class="infoP">유형 : ${marker.type}</p>
        <p class="infoP">요금 : ${
          marker.pay === "무료"
            ? marker.pay
            : `${marker.add_time_rate}분 당 ${marker.add_rates}원`
        }</p>
      </div>
      `,
    });
    markers.push(marker);
    infoWindows.push(infoWindow);
  });
  // console.log(markers);

  // 맵 마커 클릭 이벤트
  naver.maps.Event.addListener(map, "idle", function () {
    updateMarkers(map, markers);
  });

  function updateMarkers(map, markers) {
    var mapBounds = map.getBounds();
    var marker, position;

    for (var i = 0; i < markers.length; i++) {
      marker = markers[i];
      position = marker.getPosition();

      if (mapBounds.hasLatLng(position)) {
        showMarker(map, marker);
      } else {
        hideMarker(map, marker);
      }
    }
  }

  function showMarker(map, marker) {
    if (marker.setMap()) return;
    marker.setMap(map);
  }

  function hideMarker(map, marker) {
    if (!marker.setMap()) return;
    marker.setMap(null);
  }

  function getClickHandler(seq) {
    return function (e) {
      var marker = markers[seq],
        infoWindow = infoWindows[seq];

      if (infoWindow.getMap()) {
        infoWindow.close();
      } else {
        infoWindow.open(map, marker);
      }
    };
  }
  for (var i = 0, ii = markers.length; i < ii; i++) {
    naver.maps.Event.addListener(markers[i], "click", getClickHandler(i));
  }
};

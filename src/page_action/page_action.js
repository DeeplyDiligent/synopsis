// chrome.storage.onChanged.addListener(function (changes,areaName) {
// console.log("New item in storage");     console.log(changes); })



data = []
chrome
    .storage
    .onChanged
    .addListener(function (changes, namespace) {
        console.log("change recived!");
        chrome
            .storage
            .local
            .get(null, function (result) {
                moodleBeastData = result['MoodleBeast'];
                data = moodleBeastData;
                render(data);
            });
    });

chrome
    .storage
    .local
    .get(null, function (result) {
        moodleBeastData = result['MoodleBeast'];
        console.log(moodleBeastData);
        data = moodleBeastData;
        render(data);
    });

function render(data) {
    console.log('rendering...');
    // console.log(data);
    if (!(typeof data === 'undefined' || data === null)) {
        $("#mainPopup").html("");

        $(document).ready(function() {
            var isshow = localStorage.getItem('isshow');
            var dataDate = data[Object.keys(data)[0]]['dateCreated'];
            // console.log(isshow);
            if (isshow== null) {
                //showing modal on first use
                localStorage.setItem('isshow', 1);
                $('#welcomeModal').modal('show');
            } else {
                //showing modal for not been updated for ages and updating timestamp
                dateNow = moment(new Date());
                diffDays = moment.duration(dateNow.diff(dataDate)).asDays();
                console.log('hasnt been updated for: '+diffDays);
                if (diffDays>2){
                    $('#updateModal').modal('show');
                }
            }
            $('#mainPopup').append('<h3 style="display:inline-block">Last Updated '+moment(dataDate).fromNow()+'</h3>&emsp;'+
            '<a span title="Sync all from Moodle" href="https://moodle.vle.monash.edu/my/"><i style="font-size:25px" class="fa fa-refresh" aria-hidden="true"></i></a span>'+'<br/>');
        });

        var column = ""
        column+= "<table style='margin-top:20px;width:100%'><tr>"
        Object
            .keys(data)
            .forEach(function (key) {
                value = data[key];
                nameOfSubject = value['expandedname'];
                var matches = nameOfSubject.match(/\w{3}\d{4}/g);
                if (matches != null) {
                    nameOfSubject = matches;
                }
                column += "<td style='vertical-align:top'>";
                column += "<h1 style='font-size: 3vw;'>"+nameOfSubject+"</h1>"
                column += value["innerHTML"];
                column += "</td>";

            });
        column+= "</tr></table>";
        $("#mainPopup").append(column);
        $(".tree_item.branch").css({display: 'inline-flex'});
        $('#mainPopup td>li>p').css({fontSize:"20px",fontWeight:"bold",color:"black"});
        $('#mainPopup td>li').css({listStyle:"none"});
        Array.prototype.slice.call(document.getElementsByTagName("a")).forEach(function(value){value.setAttribute("target","_blank")});
    } else {
        $("#mainPopup").html("<h1>Thank you for using Synopsis</h1> <p>Please <a href='https://moodle.vle.mona" +
                "sh.edu/my/'>Open Moodle</a> so that we can create your very own database!</p>");
    }
}


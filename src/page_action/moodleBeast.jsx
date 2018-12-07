class MoodleBeast extends React.Component {
    constructor(props){
        super(props);
        this.getData;
        console.log('here');
    }
    getData(){
        data = []
        chrome.storage.local.get(null, function(result) {
        moodleBeastData = result['MoodleBeast'];
        console.log(moodleBeastData);
        data = moodleBeastData;
        render();
        });

        chrome.storage.onChanged.addListener(function(changes, namespace) {
        console.log("change recived!");
        chrome.storage.local.get(null, function(result) {
            moodleBeastData = result['MoodleBeast'];
            data = moodleBeastData;
        });
        render();

        });
    }

    render() {
        return (
        <button className="square">
            Hello
        </button>
        );
    }
}

export default MoodleBeast;
  
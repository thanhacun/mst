//crack captcha
var homepage = "http://tracuunnt.gdt.gov.vn";
var tracuu_url = "http://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp";
var temp_data = localStorage

function captcha(url){
    return "abcde";
}
//send request
function query(mst, capt){
    var url = tracuu_url + '?action=action&mst=' + mst + "&captcha=" + capt;
    $.get(url, function(data){
        error = $(data).find("p:contains('Vui')").length;
        if (error){
            var capt_url = homepage + $($(data).find("img")[0]).attr("src");
            window.open(capt_url, "Captcha");
            console.log("Try again!");
            
            
        } else {
            //var info = $(data).find(".ta_border");
            var diachi = $($(data).find(".ta_border tr:nth-child(2) td:nth-child(3) a")).attr("title");
            console.log(diachi);
            //console.log($(info[0].find("tr")[1].find("td")[2]).attr("title"));
            temp_data.setItem(mst, diachi);
        }
    }) 
}
//get data

//save to database
var mst_s = "0102578216";
var capt_s = "pem4f"
query(mst_s, capt_s);

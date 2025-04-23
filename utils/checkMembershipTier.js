exports.checkTier = (point) =>{
    if(point >= 750){
        return 'diamond';
    }else if(point >= 500){
        return 'platinum';
    }else if(point >= 250){
        return 'gold';
    }else if(point >= 125){
        return 'silver';
    }else if(point >= 50){
        return 'bronze';
    }else{
        return 'none'
    }
    
}
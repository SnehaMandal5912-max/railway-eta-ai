from sqlalchemy.orm import Session

from app.models.train import Train


def create_train(
    db: Session,
    train_number: str,
    train_name: str,
    source: str,
    destination: str
):
    train = Train(
        train_number=train_number,
        train_name=train_name,
        source=source,
        destination=destination
    )

    db.add(train)
    db.commit()
    db.refresh(train)

    return train